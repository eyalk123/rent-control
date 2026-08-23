#!/usr/bin/env bash
# Run the app on the Android emulator so changes can be inspected on a real
# native surface (fonts, safe areas, RTL, keyboard) rather than the web preview.
#
#   ./scripts/emulator.sh          boot the emulator and wait until it's ready
#   ./scripts/emulator.sh build    boot, build + install the dev client
#   ./scripts/emulator.sh start    boot, start Metro, and launch the app
#   ./scripts/emulator.sh preview  same as start, but signed-in + mock data (no backend)
#   ./scripts/emulator.sh shot     save a screenshot to .emulator-shot-<port>.png
#
# Several machine-specific quirks are handled here; see the notes on each.
#
# Two agents can drive two emulators in parallel from this one checkout. Give the second one
# its own emulator console port and its own Metro port; everything else keys off those:
#
#   AVD=rent_control_dev2 EMU_PORT=5556 PORT=8084 ./scripts/emulator.sh preview
#
# Each instance needs its OWN AVD. `-read-only` (via EMU_FLAGS) also allows sharing one AVD,
# but only if *every* running instance has the flag — starting one emulator normally takes an
# exclusive lock, and a later `-read-only` one dies with "Another emulator instance is
# running". Read-only instances also run on a throwaway overlay and lose their app install on
# exit, so a second AVD is simply better. `rent_control_dev2` exists for this.
# Budget ~4G RAM per emulator plus ~1.4G per Metro; ~3 agents fit in 32G with Chrome closed.
#
# `build` is the one verb that must NOT run in two agents at once from this checkout — Gradle
# locks the build dir. Build once, then `adb install -r` the APK to each emulator with
# ANDROID_SERIAL set.
set -euo pipefail

# A dev-only AVD on the google_apis image (Play services present, so Firebase and Google
# Sign-In still work) with 4G RAM and a 10G data partition. The stock Medium_Phone_API_36.0
# runs 2G with its data partition ~92% full, which left it swapping and killing processes.
# Override with AVD=... to use a different one.
AVD="${AVD:-rent_control_dev}"
SDK="${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}"
ADB="$SDK/platform-tools/adb.exe"
EMULATOR="$SDK/emulator/emulator.exe"
PKG="com.eyalk123.rentcontrol"

# Metro must avoid 8081/8082: `netsh interface portproxy` forwards both to a WSL
# VM (172.25.176.13) that isn't listening, so the device's requests time out and
# Metro never sees them. Check with `netsh interface portproxy show all` if 8083
# ever stops working too.
PORT="${PORT:-8083}"

# The emulator's console port doubles as its adb serial (emulator-<port>), so pinning it is
# what makes a second instance addressable instead of racing for whatever port is free.
# Must be even. EMU_FLAGS carries extras like -read-only for same-AVD second instances.
EMU_PORT="${EMU_PORT:-5554}"
EMU_FLAGS="${EMU_FLAGS:-}"

# Records which mode the running Metro was started in, so `preview` can reuse a Metro that
# already has the flag instead of paying a full cold rebuild every invocation.
# Scoped by port: two agents share this checkout, and MODE_FILE in particular decides whether
# `preview` may reuse a warm Metro — a shared one makes each agent misread the other's mode.
MODE_FILE=".emulator-metro-mode-$PORT"
METRO_LOG=".emulator-metro-$PORT.log"
EMU_LOG=".emulator-emu-$EMU_PORT.log"
SHOT=".emulator-shot-$PORT.png"

# Metro has to outlive this script, or every run starts a cold bundler and pays the full
# rebuild. A plain `&` child is torn down when the shell that spawned it exits, so detach with
# nohup + disown and give it a log file to write to.
# Metro's /status can block for several seconds while it is mid-transform, so a tight timeout
# reports a perfectly healthy bundler as down. Retry before believing it.
metro_up() {
  local i
  for i in 1 2 3; do
    if curl -s -m 15 -o /dev/null "http://127.0.0.1:$PORT/status"; then return 0; fi
    sleep 1
  done
  return 1
}

# Free the port whoever holds it. Called before spawning, so a Metro that merely *looked* down
# can never end up with a second bundler fighting it for the port.
free_port() {
  local pid
  for pid in $(netstat -ano | awk -v p=":$PORT" '$2 ~ p"$" && $4 == "LISTENING" {print $5}' | sort -u); do
    # Single-slash flags: MSYS_NO_PATHCONV=1 above already disables path mangling, so the
    # usual Git Bash `//F` escape would reach taskkill literally and be rejected.
    taskkill /F /PID "$pid" >/dev/null 2>&1 || true
  done
  local i
  for i in $(seq 15); do
    netstat -ano | grep -q ":$PORT .*LISTENING" || return 0
    sleep 1
  done
  echo "could not free port $PORT — kill the node process on it and retry" >&2
  return 1
}

# Metro keys its transform cache off the OS temp dir, so two bundlers started from this one
# checkout share a cache and clobber each other — the second one then serves a 1-module stub
# (`Bundled 96ms ... (1 module)`) and the app hangs forever on "Loading from 10.0.2.2:<port>".
# Give each port its own temp root. Metro reads TMPDIR; node's os.tmpdir() on Windows reads
# TEMP/TMP, so set all three.
metro_tmp() {
  local d="$PWD/.emulator-metro-tmp-$PORT"
  mkdir -p "$d"
  echo "$d"
}

spawn_metro() {
  free_port
  local tmp; tmp="$(metro_tmp)"
  nohup env TMPDIR="$tmp" TEMP="$tmp" TMP="$tmp" "$@"     npx expo start --dev-client --port "$PORT" </dev/null >"$METRO_LOG" 2>&1 &
  disown
  until metro_up; do sleep 2; done
}

# Gradle needs JDK 17+; the `java` on PATH is JDK 8.
export JAVA_HOME="${JAVA_HOME_OVERRIDE:-/c/Program Files/Android/Android Studio/jbr}"

export MSYS_NO_PATHCONV=1   # keep Git Bash from mangling /data, /sdcard, etc.

# Target the emulator explicitly. adb fails every command with "more than one device/emulator"
# as soon as anything else is attached (a plugged-in phone, even an unauthorized one), and
# that failure otherwise reads as "not booted" and starts a second emulator.
# Ends with `return 0` deliberately: a bare `[ -n "$s" ] && …` that fails would take the whole
# script down under `set -e`, and "no emulator yet" is a normal state here.
# Derived from EMU_PORT rather than "first emulator in the list": with two running, picking the
# first silently points both agents at the same device.
pick_serial() {
  if [ -z "${ANDROID_SERIAL:-}" ]; then
    export ANDROID_SERIAL="emulator-$EMU_PORT"
  fi
  return 0
}
pick_serial

booted() { [ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; }

boot() {
  if booted; then echo "emulator already running"; return; fi
  echo "starting $AVD ..."
  # Detached for the same reason as Metro: a plain `&` child dies with the shell that spawned
  # it, which tears the emulator down the moment this script returns.
  # shellcheck disable=SC2086 -- EMU_FLAGS is a deliberate word-split of extra emulator flags.
  nohup "$EMULATOR" -avd "$AVD" -port "$EMU_PORT" $EMU_FLAGS -no-snapshot-load -no-boot-anim     </dev/null >"$EMU_LOG" 2>&1 &
  disown
  # Wait for *this* serial. A bare '^emulator-' match is already true when another agent's
  # emulator is up, so it would fall through and then poll a device that never booted.
  until "$ADB" devices | grep -q "^$ANDROID_SERIAL[[:space:]]"; do sleep 2; done
  until booted; do sleep 3; done
  echo "emulator ready (${ANDROID_SERIAL:-default})"
}

# x86_64 only. The emulator cannot execute the arm64-v8a slice, and shipping both
# makes an APK too big for the AVD's nearly-full 6G data partition (it fails with
# INSTALL_FAILED_INSUFFICIENT_STORAGE). One ABI: 136M -> 84M.
build() {
  boot
  (cd android && ./gradlew.bat app:assembleDebug -x lint -x test --build-cache \
      -PreactNativeArchitectures=x86_64)
  "$ADB" install -r android/app/build/outputs/apk/debug/app-debug.apk
}

start() {
  boot
  if ! metro_up; then
    echo "starting Metro on $PORT ..."
    echo plain > "$MODE_FILE"
    spawn_metro env
  fi
  launch
}

# Stub out Firebase auth and serve mock data, so screens behind the auth guard are reachable
# without a real account or a running backend (src/core/auth/AuthContext.tsx). EXPO_PUBLIC_*
# vars are inlined when Metro builds the bundle, so this needs a Metro restart but NOT a
# Gradle rebuild or a reinstall.
preview() {
  boot
  if metro_up && [ "$(cat "$MODE_FILE" 2>/dev/null)" = "preview" ]; then
    echo "reusing the Metro already running in preview mode on $PORT"
  else
    # A Metro started without the flag has already inlined the old value into the bundle.
    echo "starting Metro on $PORT with preview mode on ..."
    echo preview > "$MODE_FILE"
    spawn_metro env EXPO_PUBLIC_DEV_WEB_PREVIEW=1
  fi
  launch
}

# Build the JS bundle from the host before pointing the app at Metro.
#
# This is the fix for the dev client dying with `SocketTimeoutException: Read timed out` on the
# first launch after Metro starts. Its HTTP read timeout is shorter than a cold Metro takes to
# transform this app: measured here at 67.2s cold versus 0.45s once cached — a 150x difference,
# and the app is ~21MB of dev bundle. curl has no such timeout, so building it here first turns
# the device's request into a cache hit. Costs nothing when the cache is already warm.
prewarm() {
  local url="http://127.0.0.1:$PORT/.expo/.virtual-metro-entry.bundle"
  url="$url?platform=android&dev=true&hot=false&transform.engine=hermes&transform.routerRoot=app"
  echo "building the bundle (first run after a Metro start takes ~1 min) ..."
  # NOT `-o /dev/null`: MSYS_NO_PATHCONV=1 above stops Git Bash rewriting the path, so curl
  # tries to open a literal /dev/null, fails to write, and exits 23 on an otherwise fine 200.
  if ! curl -s -o NUL --max-time 600 "$url"; then
    echo "warning: could not pre-build the bundle; the app may time out on first load" >&2
  fi
}

# Route the device to Metro over adb's own transport, not the emulator's slirp NAT.
#
# 10.0.2.2 works for small requests but corrupts the 21MB bundle: the dev client fetches it as
# a multipart/chunked stream and okhttp dies mid-body with
#   ProtocolException: Expected leading [0-9a-fA-F] character but was 0xd
#   at MultipartStreamReader.readAllParts / BundleDownloader.processMultipartResponse
# leaving the app parked on "Bundling 100.0%" forever. Metro is fine -- curl pulls the same
# 21MB multipart response from the host in 0.5s -- the framing is mangled in transit.
#
# `adb reverse` + localhost fixes it outright (ProtocolException count 0, app renders). The
# older note that reverse "looks configured and still fails" held only for 8081/8082, which the
# WSL `netsh portproxy` hijacks on localhost; 8083+ are clear, so guard on that instead of
# avoiding reverse altogether.
host_for_device() {
  case "$PORT" in
    8081|8082) echo "10.0.2.2" ;;
    *) if "$ADB" reverse "tcp:$PORT" "tcp:$PORT" >/dev/null 2>&1; then
         echo "localhost"
       else
         echo "10.0.2.2"
       fi ;;
  esac
}

launch() {
  prewarm
  local host; host="$(host_for_device)"
  echo "device will reach Metro at $host:$PORT"
  "$ADB" shell am start -a android.intent.action.VIEW     -d "rentcontrol://expo-development-client/?url=http%3A%2F%2F$host%3A$PORT" >/dev/null
  echo "launched — the bundle is already built, so this should come up in seconds"
}

case "${1:-boot}" in
  boot)    boot ;;
  build)   build ;;
  start)   start ;;
  preview) preview ;;
  shot)    "$ADB" exec-out screencap -p > "$SHOT"; echo "wrote $SHOT" ;;
  *)       echo "usage: $0 [boot|build|start|preview|shot]" >&2; exit 1 ;;
esac
