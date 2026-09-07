// Turns Firebase Analytics collection off explicitly on Android.
//
// The app does not use Analytics at all: no @react-native-firebase/analytics dependency,
// no measurement_id in google-services.json, and IS_ANALYTICS_ENABLED is false in
// GoogleService-Info.plist. Android was the one platform where the state was accidental
// rather than declared — the manifest simply had no firebase_analytics_collection_enabled
// key, so "off" rested on the package being absent. This writes the key as false so a
// future dependency that pulls the Analytics SDK in transitively cannot start collecting
// silently.
//
// It has to be a plugin, not a hand edit: android/ is generated (.gitignore) and any change
// to AndroidManifest.xml is erased by the next prebuild.
const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

const META_DATA_NAME = 'firebase_analytics_collection_enabled';

module.exports = function withAnalyticsCollectionDisabled(config) {
  return withAndroidManifest(config, (cfg) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      META_DATA_NAME,
      'false',
    );
    return cfg;
  });
};
