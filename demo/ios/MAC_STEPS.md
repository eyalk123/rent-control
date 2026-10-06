> **Not used.** Superseded: the iOS screenshots are captured by Claude driving a NoMac cloud Mac with Maestro. Kept for reference only.

# iOS App Store screenshots — Mac steps

Run in Terminal, in order. Assumes the repo is cloned at `~/rent-control`; change the path if not.
Passwords for the demo accounts are not in the repo. Have them ready from the PC.

## 1. Get the latest repo

```bash
cd ~/rent-control
git pull
```

## 2. Download and extract the simulator build

```bash
mkdir -p ~/rv-build && cd ~/rv-build
curl -L -o RentVance-sim.tar.gz https://expo.dev/artifacts/eas/63D7Bqzxk-zxAYaO9bawfgycQ3FFb6bzh_skdjhojCA.tar.gz
tar -xzf RentVance-sim.tar.gz
ls -d RentVance.app
```

## 3. Boot the largest Pro Max and install

```bash
open -a Simulator
xcrun simctl list devices available | grep "Pro Max"
```

Pick the newest Pro Max in that list. An iPhone 16/17 Pro Max gives 1320×2868; a 14/15 Pro Max gives 1290×2796.
Boot it from Simulator.app (File → Open Simulator) or run:

```bash
xcrun simctl boot "iPhone 16 Pro Max"
xcrun simctl install booted ~/rv-build/RentVance.app
```

## 4. Put the sample leases in Files

```bash
open ~/rent-control/demo/leases
```

Drag the 4 PDFs onto the simulator window and save each to Files → On My iPhone.

## 5. English: Michael's US account

```bash
cd ~/rent-control/demo/ios
OUT=~/rv-shots ./capture.sh iphone en
```

Sign in as `demo.us@rentvance.app`, with the app language set to English.

## 6. Hebrew: Dana's Israeli account (fresh install first)

```bash
xcrun simctl uninstall booted com.eyalk123.rentcontrol
xcrun simctl install booted ~/rv-build/RentVance.app
OUT=~/rv-shots ./capture.sh iphone he
```

Sign in as `demo.il@rentvance.app`, with the app language set to Hebrew. The leases stay in Files, so you don't need to drag them again.

## 7. Review shots: free account + Sandbox Apple ID

Prices only appear for a free-plan account, not the demo accounts. First sign into your Sandbox Apple ID in the simulator's
Settings → Developer → Sandbox Apple Account. On older iOS it's Settings → App Store → Sandbox Account. Then:

```bash
xcrun simctl uninstall booted com.eyalk123.rentcontrol
xcrun simctl install booted ~/rv-build/RentVance.app
OUT=~/rv-shots ./capture.sh review
```

## 8. Clean up and zip

```bash
xcrun simctl status_bar booted clear
cd ~/rv-shots && zip -r ~/Desktop/ios-screenshots.zip ios
```

Send `~/Desktop/ios-screenshots.zip` back to the PC.
