// Allows non-modular header includes inside framework modules for all pod targets.
//
// Insurance for the @react-native-firebase + Expo SDK 54 + useFrameworks "static"
// setup (see expo/expo#39607): framework-module pods can import non-modular
// React-Core headers, which Xcode promotes to an error under -Werror. The primary
// fix is forceStaticLinking on the RNFB pods (configured in expo-build-properties),
// which takes them out of the framework-module path; this build setting covers any
// remaining framework-module pod that still does a non-modular include.
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const ANCHOR = 'post_install do |installer|';
const INJECTION = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end`;

module.exports = function withAllowNonModularIncludes(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf-8');
      if (contents.includes(ANCHOR) && !contents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
        contents = contents.replace(ANCHOR, ANCHOR + INJECTION);
        fs.writeFileSync(podfilePath, contents);
      }
      return cfg;
    },
  ]);
};
