require('dotenv').config();

const appJson = require('./app.json');

const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    icon: IS_PREVIEW
      ? './assets/images/rent-control-icon-no-text.png'
      : appJson.expo.icon,
    ios: {
      ...appJson.expo.ios,
      bundleIdentifier: IS_PREVIEW
        ? 'com.eyalk123.rentcontrol.preview'
        : appJson.expo.ios.bundleIdentifier,
    },
    android: {
      ...appJson.expo.android,
      package: IS_PREVIEW
        ? 'com.eyalk123.rentcontrol.preview'
        : appJson.expo.android.package,
      adaptiveIcon: {
        ...appJson.expo.android.adaptiveIcon,
        foregroundImage: IS_PREVIEW
          ? './assets/images/rent-control-icon-no-text.png'
          : appJson.expo.android.adaptiveIcon.foregroundImage,
      },
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
      firebaseWebClientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID || '',
      supportsRTL: true,
      eas: {
        projectId: '751de006-44a2-4bd6-b675-70e0b5af8517',
      },
    },
  },
};
