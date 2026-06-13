// Gives GoogleUtilities modular headers so Firebase's Swift pods
// (FirebaseCoreInternal, FirebaseStorage, ...) can import it as a Clang module.
//
// @react-native-firebase pulls the Firebase iOS SDK, whose Swift pods require
// GoogleUtilities to define modules. Otherwise CocoaPods fails with:
//   "FirebaseCoreInternal depends upon GoogleUtilities, which does not define
//    modules. ... specify :modular_headers => true for particular dependencies."
//
// This is the non-framework alternative to use_frameworks! :linkage => :static.
// Static frameworks broke RCT_EXPORT_MODULE/RCT_EXPORT_METHOD expansion in RNFB's
// own native modules (RNFBStorageModule.m). Keeping default static libraries lets
// those compile normally while still satisfying Firebase's module requirement.
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// use_expo_modules! lives inside the app target in the Expo-generated Podfile,
// so injecting after it places the pod directive in the correct scope.
const ANCHOR = 'use_expo_modules!';
const POD_LINE = "\n  pod 'GoogleUtilities', :modular_headers => true";

module.exports = function withFirebaseModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf-8');
      if (contents.includes(ANCHOR) && !contents.includes("pod 'GoogleUtilities'")) {
        contents = contents.replace(ANCHOR, ANCHOR + POD_LINE);
        fs.writeFileSync(podfilePath, contents);
      }
      return cfg;
    },
  ]);
};
