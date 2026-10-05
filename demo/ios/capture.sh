#!/usr/bin/env bash
# App Store screenshot capture for the booted iOS Simulator (macOS, bash 3.2 compatible).
#
#   capture.sh iphone en      # 01_home … 07_chat  -> ios/iphone/en/
#   capture.sh ipad he        # same, Hebrew       -> ios/ipad/he/
#   capture.sh review         # 6 subscription shots -> ios/review/<product id>.png
#
# Files go under $OUT (default: the current directory). For each shot it prints what to
# open, waits for Enter, then saves the shot. Type s + Enter to skip, q + Enter to stop.
# Existing files are overwritten, so re-run to redo a bad shot (skip the good ones).
set -u

OUT="${OUT:-$PWD}"

usage() {
  echo "usage: $0 <iphone|ipad> <en|he>"
  echo "       $0 review"
  exit 1
}

die() { echo "error: $*" >&2; exit 1; }

case "${1:-} ${2:-}" in
  "review "|"iphone en"|"iphone he"|"ipad en"|"ipad he") ;;
  *) usage ;;
esac

command -v xcrun >/dev/null || die "xcrun not found; install Xcode and run: sudo xcode-select -s /Applications/Xcode.app"
xcrun simctl list devices booted | grep -q "(Booted)" || die "no simulator is booted; boot one in Simulator.app first"

status_bar() {
  xcrun simctl status_bar booted override \
    --time "9:41" \
    --dataNetwork wifi \
    --wifiMode active --wifiBars 3 \
    --cellularMode active --cellularBars 4 \
    --operatorName "" \
    --batteryState charged --batteryLevel 100 \
    || die "status bar override failed (needs Xcode 11+ and an iOS 13+ simulator)"
  echo "Status bar set: 9:41, 100% charged, full cellular + wifi."
  echo "(Undo later with: xcrun simctl status_bar booted clear)"
}

# Accepted sizes per device, portrait or landscape.
expected_sizes() {
  case "$1" in
    iphone) echo "1320x2868 2868x1320 1290x2796 2796x1290" ;;
    ipad)   echo "2064x2752 2752x2064 2048x2732 2732x2048" ;;
  esac
}

report() { # report <file> <device>
  local f="$1" w h bytes size ok=no s
  w=$(sips -g pixelWidth "$f" 2>/dev/null | awk '/pixelWidth/ {print $2}')
  h=$(sips -g pixelHeight "$f" 2>/dev/null | awk '/pixelHeight/ {print $2}')
  bytes=$(stat -f%z "$f" 2>/dev/null || echo "?")
  size="${w}x${h}"
  echo "  saved $f  ${w}×${h}  (${bytes} bytes)"
  for s in $(expected_sizes "$2"); do [ "$size" = "$s" ] && ok=yes; done
  if [ "$ok" = no ]; then
    case "$2" in
      iphone) echo "  WARNING: ${w}×${h} is not 1320×2868 or 1290×2796. Use an iPhone 16/17 Pro Max (6.9\") or 15/14 Pro Max (6.7\") simulator." ;;
      ipad)   echo "  WARNING: ${w}×${h} is not 2064×2752 or 2048×2732. Use an iPad Pro 13-inch (M4) or iPad Pro 12.9-inch simulator." ;;
    esac
  fi
}

shoot() { # shoot <dir> <name> <device> <hint>
  local dir="$1" name="$2" device="$3" hint="$4" ans path
  path="$dir/$name.png"
  echo
  echo "── $name"
  printf '%b\n' "$hint" | sed 's/^/   /'
  printf '   Enter = capture, s = skip, q = quit: '
  read -r ans
  case "$ans" in
    q|Q) echo "Stopped."; exit 0 ;;
    s|S) echo "  skipped"; return ;;
  esac
  xcrun simctl io booted screenshot "$path" >/dev/null 2>&1 || { echo "  ERROR: screenshot failed"; return; }
  report "$path" "$device"
}

capture_store() { # capture_store <device> <lang>
  local device="$1" lang="$2" dir account oak emily
  dir="$OUT/ios/$device/$lang"
  mkdir -p "$dir"
  if [ "$lang" = en ]; then
    account="Michael's US account (demo.us@rentvance.app); app language English"
    oak="418 Oak Ave"; emily="Emily Chen"
  else
    account="Dana's Israeli account (demo.il@rentvance.app); app language Hebrew (RTL)"
    oak="הרצל 12"; emily="אלון ברק"
  fi
  echo "Device: $device   Language: $lang   Saving to: $dir"
  echo "Sign in with $account."
  echo "Match the Android captures (screenshots/store/android/$lang/ on the PC)."
  status_bar

  shoot "$dir" 01_home     "$device" "Home screen, scrolled to the top."
  shoot "$dir" 02_scan     "$device" "Scan a sample lease (rent-control/demo/leases/, saved to Files), stop on \"Review what we found\"."
  shoot "$dir" 03_payments "$device" "Open $oak → Transactions tab, showing the 2026 payment grid."
  shoot "$dir" 04_lease    "$device" "Open $emily → lease years, with year 3 marked current."
  shoot "$dir" 05_earnings "$device" "Transactions tab showing September's profit."
  shoot "$dir" 06_report   "$device" "Reports → Income & Expense export for 2025."
  shoot "$dir" 07_chat     "$device" "Assistant answering \"Who hasn't paid this month?\" with source chips visible.\nIf the answer contains an em-dash (—), ask again."
  echo
  echo "Done: $dir"
}

capture_review() {
  local dir="$OUT/ios/review" id tier period
  mkdir -p "$dir"
  echo "Saving to: $dir"
  echo "Use an account on the FREE plan (prices are only offered to free accounts)."
  echo "Open Settings → Plan → See plans. Prices must have loaded from the App Store."
  status_bar
  for id in \
    rentvance.tier_16_plus.monthly rentvance.tier_16_plus.yearly \
    rentvance.tier_9_15.monthly    rentvance.tier_9_15.yearly \
    rentvance.tier_3_8.monthly     rentvance.tier_3_8.yearly
  do
    tier=$(echo "$id" | cut -d. -f2); period=$(echo "$id" | cut -d. -f3)
    case "$tier" in
      tier_16_plus) tier="16+ properties" ;;
      tier_9_15)    tier="9–15 properties" ;;
      tier_3_8)     tier="3–8 properties" ;;
    esac
    shoot "$dir" "$id" iphone "Plans screen: select ${period}, show the ${tier} plan with its price."
  done
  echo
  echo "Done: $dir"
}

case "${1:-}" in
  review) capture_review ;;
  iphone|ipad)
    case "${2:-}" in en|he) capture_store "$1" "$2" ;; *) usage ;; esac ;;
  *) usage ;;
esac
