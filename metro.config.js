const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force react-i18next to use CommonJS build (fixes Metro ESM resolution)
// Must NOT disable package exports globally - axios needs it for react-native build
config.resolver = config.resolver || {};

// lucide-react-native ships .mjs files; Metro doesn't include 'mjs' in sourceExts by default.
if (!config.resolver.sourceExts.includes('mjs')) {
  config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];
}

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-i18next') {
    return {
      filePath: path.join(
        __dirname,
        'node_modules',
        'react-i18next',
        'dist',
        'commonjs',
        'index.js'
      ),
      type: 'sourceFile',
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
