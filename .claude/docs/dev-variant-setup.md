# Development Variant Firebase Setup

The code changes are done. You now have 3 variants:

| Variant | Package name | Firebase app |
|---|---|---|
| development | `com.eyalk123.rentcontrol.dev` | needs to be created |
| preview | `com.eyalk123.rentcontrol.preview` | already exists |
| production | `com.eyalk123.rentcontrol` | already exists |

## Steps to complete the setup

### 1. Register the new Android app in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) → your project
2. Project settings → "Your apps" → **Add app** → Android
3. Android package name: `com.eyalk123.rentcontrol.dev`
4. App nickname: `rent-control-dev`
5. Register app — skip the SHA-1 for now (add it in step 2)

### 2. Get the SHA-1 of your development build signing key

EAS development builds are signed with your local debug keystore. Run:

```bash
eas credentials
```

Select **Android → development → Keystore**, then copy the SHA-1 fingerprint shown.

Alternatively, if you already have a keystore locally:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Then in Firebase Console → your new `rent-control-dev` app → Add fingerprint → paste the SHA-1.

### 3. Download the updated google-services.json

After adding the new app, Firebase Console will have an updated `google-services.json` that includes all 3 apps.

1. Firebase Console → Project settings → Your apps → scroll to the Android section
2. Click **Download google-services.json**
3. Replace `./google-services.json` in the repo root with the downloaded file

> The single `google-services.json` file contains entries for all 3 package names — you do not need separate files per variant.

### 4. Verify Google Sign-In works

Google Sign-In requires the SHA-1 of the signing certificate to be registered for each app. Make sure the SHA-1 from step 2 is registered under the `rent-control-dev` Firebase app entry. If you use EAS cloud builds, EAS may use a different keystore — run `eas credentials` to confirm the correct SHA-1.

### 5. Build and test

```bash
eas build --profile development --platform android
```

You should now be able to install the dev build alongside your preview and production builds on the same device.
