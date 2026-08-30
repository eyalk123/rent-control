require('dotenv').config();

const appJson = require('./app.json');

const IS_PREVIEW = process.env.APP_VARIANT === 'preview';
const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    icon: IS_DEV || IS_PREVIEW
      ? './assets/images/rent-control-icon-no-text.png'
      : appJson.expo.icon,
    ios: {
      ...appJson.expo.ios,
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST || appJson.expo.ios.googleServicesFile,
      bundleIdentifier: IS_DEV
        ? 'com.eyalk123.rentcontrol.dev'
        : IS_PREVIEW
        ? 'com.eyalk123.rentcontrol.preview'
        : appJson.expo.ios.bundleIdentifier,
    },
    android: {
      ...appJson.expo.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || appJson.expo.android.googleServicesFile,
      package: IS_DEV
        ? 'com.eyalk123.rentcontrol.dev'
        : IS_PREVIEW
        ? 'com.eyalk123.rentcontrol.preview'
        : appJson.expo.android.package,
      adaptiveIcon: {
        ...appJson.expo.android.adaptiveIcon,
        foregroundImage: IS_DEV || IS_PREVIEW
          ? './assets/images/rent-control-icon-no-text.png'
          : appJson.expo.android.adaptiveIcon.foregroundImage,
      },
    },
    extra: {
      // Read at runtime by Sentry (app/_layout.tsx) as the `environment` tag. Unset in
      // the production build profile, which is what 'production' below stands in for.
      appVariant: process.env.APP_VARIANT || 'production',
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
      firebaseWebClientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID || '',
      supportsRTL: true,
      eas: {
        projectId: '751de006-44a2-4bd6-b675-70e0b5af8517',
      },
    },
  },
};
