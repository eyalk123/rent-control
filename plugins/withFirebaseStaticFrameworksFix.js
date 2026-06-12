// Podfile fixes required to build @react-native-firebase with static frameworks
// (expo-build-properties ios.useFrameworks: "static").
//
// 1. $RNFirebaseAsStaticFramework = true
//    Makes RNFirebase's own pods build as static frameworks, matching
//    use_frameworks! :linkage => :static. Without it, files like
//    RNFBStorageModule.m can't see React's RCT_EXPORT_METHOD macro and fail with
//    "type specifier missing / expected ')'". Required by react-native-firebase.
//
// 2. CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES
//    RNFirebase framework modules import non-modular React-Core headers
//    (RCTConvert.h, RCTBridgeModule.h, RCTEventEmitter.h). Xcode promotes that
//    warning to an error under -Werror; this relaxes it for all pod targets.
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const ANCHOR = 'post_install do |installer|';
const BUILD_SETTING_INJECTION = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end`;

module.exports = function withFirebaseStaticFrameworksFix(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf-8');

      if (!contents.includes('$RNFirebaseAsStaticFramework')) {
        contents = '$RNFirebaseAsStaticFramework = true\n' + contents;
      }

      if (contents.includes(ANCHOR) && !contents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
        contents = contents.replace(ANCHOR, ANCHOR + BUILD_SETTING_INJECTION);
      }

      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
};
