require('dotenv').config();

const appJson = require('./app.json');

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
      supportsRTL: true,
      eas: {
        projectId: '751de006-44a2-4bd6-b675-70e0b5af8517',
      },
    },
  },
};
