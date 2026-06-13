// Gives Firebase's non-modular C/ObjC dependencies modular headers so its Swift
// pods (FirebaseAuth, FirebaseStorage, AppCheckCore, FirebaseCoreInternal, ...)
// can import them as Clang modules when building as static libraries.
//
// @react-native-firebase pulls the Firebase iOS SDK, whose Swift pods require
// these dependencies to define modules. Otherwise CocoaPods fails with:
//   "The Swift pod `FirebaseAuth` depends upon `FirebaseAuthInterop`, ... which
//    do not define modules. ... specify :modular_headers => true for particular
//    dependencies."
//
// This is the non-framework alternative to use_frameworks! :linkage => :static.
// Static frameworks broke RCT_EXPORT_MODULE/RCT_EXPORT_METHOD expansion in RNFB's
// own native modules (RNFBStorageModule.m). Keeping default static libraries lets
// those compile normally while still satisfying Firebase's module requirement.
//
// Scoped to just these pods (rather than global use_modular_headers!) to avoid
// forcing modular headers onto React-Core. CocoaPods lists every offending Swift
// dependency at once, so this set is complete for the Auth + Storage + AppCheck
// dependency graph.
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// use_expo_modules! lives inside the app target in the Expo-generated Podfile,
// so injecting after it places the pod directives in the correct scope.
const ANCHOR = 'use_expo_modules!';
const MODULAR_PODS = [
  'GoogleUtilities',
  'RecaptchaInterop',
  'FirebaseAuthInterop',
  'FirebaseAppCheckInterop',
];

module.exports = function withFirebaseModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf-8');
      if (!contents.includes(ANCHOR)) {
        return cfg;
      }
      const lines = MODULAR_PODS
        .filter((name) => !contents.includes(`pod '${name}'`))
        .map((name) => `\n  pod '${name}', :modular_headers => true`)
        .join('');
      if (lines) {
        contents = contents.replace(ANCHOR, ANCHOR + lines);
        fs.writeFileSync(podfilePath, contents);
      }
      return cfg;
    },
  ]);
};
