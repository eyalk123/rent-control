# iOS App Store screenshots — Mac steps

For the rented MacinCloud Managed Server (macOS 14, Xcode 16.1, no admin rights, shared machine).
Needs only Xcode, git and curl. Run the blocks in Terminal, in order.
Have these ready from the PC: a temporary GitHub token, the demo account passwords, and the
Sandbox Apple ID. None of them are in the repo.

## 0. Start a shell that keeps no history

```bash
bash
unset HISTFILE
```

Run every later step in this same window, so nothing you type is saved to disk.

## a. Clone the branch into your home folder

Paste your token in place of `<TOKEN>`. `credential.helper=` stops git saving the token in the Keychain.

```bash
cd ~
git -c credential.helper= clone -b ios-screenshots https://<TOKEN>@github.com/eyalk123/rent-control.git
cd ~/rent-control
git config credential.helper ""
git config user.name "eyalk123"
git config user.email "<your GitHub email>"
```

The `user.*` settings apply only to this clone.

## b. Download and extract the simulator build

```bash
mkdir -p ~/rv-build && cd ~/rv-build
curl -L -o rentvance-sim.tar.gz "https://expo.dev/artifacts/eas/63D7Bqzxk-zxAYaO9bawfgycQ3FFb6bzh_skdjhojCA.tar.gz"
tar -xzf rentvance-sim.tar.gz
APP=$(find ~/rv-build -maxdepth 2 -name "*.app" | head -1); echo "$APP"
```

The last line should print a path ending in `.app`.

## c. Boot the iPhone 16 Pro Max and install

```bash
open -a Simulator
xcrun simctl boot "iPhone 16 Pro Max"
xcrun simctl install booted "$APP"
```

If `boot` says the device is already booted, carry on.
To see the device names on this Mac, run `xcrun simctl list devices available`.

## d. Put the lease PDFs in Files

`xcrun simctl addmedia` only takes photos, videos and contacts, so it can't add PDFs. Copy them straight
into the simulator's Files storage instead:

```bash
FILES=$(xcrun simctl get_app_container booted com.apple.DocumentsApp groups | awk '/FileProvider.LocalStorage/ {print $2}')
mkdir -p "$FILES/File Provider Storage"
cp ~/rent-control/demo/leases/*.pdf "$FILES/File Provider Storage/"
```

Check that they show up in the simulator's Files app, under On My iPhone.
If they don't, run `open ~/rent-control/demo/leases`, drag the 4 PDFs onto the simulator window, and save each one to Files.
The PDFs stay in Files when you delete the app, so you only do this once.

## e. Capture

Shots are saved to `~/rent-control/screenshots/raw/ios/`, next to the Android ones.

**English: Michael** (`demo.us@rentvance.app`, app language English)

```bash
cd ~/rent-control/demo/ios
OUT=~/rent-control/screenshots/raw ./capture.sh iphone en
```

**Hebrew: Dana** (`demo.il@rentvance.app`, app language Hebrew). Delete and reinstall the app first:

```bash
xcrun simctl uninstall booted com.eyalk123.rentcontrol
xcrun simctl install booted "$APP"
OUT=~/rent-control/screenshots/raw ./capture.sh iphone he
```

**Review: a new free account.** First sign the simulator into the Sandbox Apple ID. Open the simulator's
Settings → App Store → Sandbox Account. On iOS 18 it may be under Settings → Developer → Sandbox Apple Account.
Then delete and reinstall the app, and sign up for a new account in it:

```bash
xcrun simctl uninstall booted com.eyalk123.rentcontrol
xcrun simctl install booted "$APP"
OUT=~/rent-control/screenshots/raw ./capture.sh review
```

## f. Commit and push the screenshots

```bash
cd ~/rent-control
git add screenshots/raw/ios
git commit -m "chore(screenshots): iOS App Store captures"
git push origin ios-screenshots
```

## g. Clean up (the machine is shared)

```bash
xcrun simctl status_bar booted clear
xcrun simctl uninstall booted com.eyalk123.rentcontrol
xcrun simctl shutdown all
xcrun simctl erase "iPhone 16 Pro Max"
printf 'protocol=https\nhost=github.com\n\n' | git credential-osxkeychain erase 2>/dev/null
cd ~ && rm -rf ~/rent-control ~/rv-build
history -c
exit
```

`erase` resets the simulator, which signs out the Sandbox Apple ID and removes the PDFs.
After `exit` you're back in the normal shell. Then delete the token on GitHub (Settings → Developer settings → Tokens).
