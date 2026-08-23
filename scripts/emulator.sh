#!/usr/bin/env bash
# Run the app on the Android emulator so changes can be inspected on a real
# native surface (fonts, safe areas, RTL, keyboard) rather than the web preview.
#
#   ./scripts/emulator.sh          boot the emulator and wait until it's ready
#   ./scripts/emulator.sh build    boot, build + install the dev client
#   ./scripts/emulator.sh start    boot, start Metro, and launch the app
#   ./scripts/emulator.sh preview  same as start, but signed-in + mock data (no backend)
#   ./scripts/emulator.sh shot     save a screenshot to .emulator-shot.png
#
# Several machine-specific quirks are handled here; see the notes on each.
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

# Records which mode the running Metro was started in, so `preview` can reuse a Metro that
# already has the flag instead of paying a full cold rebuild every invocation.
MODE_FILE=".emulator-metro-mode"
METRO_LOG=".emulator-metro.log"
EMU_LOG=".emulator-emu.log"

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

spawn_metro() {
  free_port
  nohup "$@" npx expo start --dev-client --port "$PORT" </dev/null >"$METRO_LOG" 2>&1 &
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
pick_serial() {
  if [ -z "${ANDROID_SERIAL:-}" ]; then
    local s
    s=$("$ADB" devices | awk '/^emulator-/ {print $1; exit}')
    if [ -n "$s" ]; then export ANDROID_SERIAL="$s"; fi
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
  nohup "$EMULATOR" -avd "$AVD" -no-snapshot-load -no-boot-anim </dev/null >"$EMU_LOG" 2>&1 &
  disown
  until "$ADB" devices | grep -q '^emulator-'; do sleep 2; done
  pick_serial
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
  if ! curl -s -o /dev/null --max-time 600 "$url"; then
    echo "warning: could not pre-build the bundle; the app may time out on first load" >&2
  fi
}

launch() {
  prewarm
  # Reach Metro via the emulator's host alias 10.0.2.2, not `adb reverse` +
  # localhost — localhost is what the WSL portproxy above intercepts.
  "$ADB" shell am start -a android.intent.action.VIEW \
    -d "rentcontrol://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A$PORT" >/dev/null
  echo "launched — the bundle is already built, so this should come up in seconds"
}

case "${1:-boot}" in
  boot)    boot ;;
  build)   build ;;
  start)   start ;;
  preview) preview ;;
  shot)    "$ADB" exec-out screencap -p > .emulator-shot.png; echo "wrote .emulator-shot.png" ;;
  *)       echo "usage: $0 [boot|build|start|preview|shot]" >&2; exit 1 ;;
esac
