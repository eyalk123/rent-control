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
  // pdf-lib pins its own tslib 1.x, whose ESM entry (modules/index.js) just re-exports the
  // default of the CommonJS build. Metro resolves that default to `undefined`, so pdf-lib
  // blows up at import time ("Cannot destructure property '__extends'"). Pin every tslib
  // import to the root CommonJS build (2.x, a superset of the 1.x helpers).
  if (moduleName === 'tslib') {
    return {
      filePath: path.join(__dirname, 'node_modules', 'tslib', 'tslib.js'),
      type: 'sourceFile',
    };
  }
  // Route per-icon deep imports (e.g. 'lucide-react-native/icons/pencil') to the real
  // .mjs module, bypassing the package's `exports` map (which only exposes '.' and a full
  // './icons' barrel). This avoids pulling all ~1,700 Lucide icons into the bundle.
  const lucide = moduleName.match(/^lucide-react-native\/icons\/(.+)$/);
  if (lucide) {
    return {
      filePath: path.join(
        __dirname,
        'node_modules',
        'lucide-react-native',
        'dist',
        'esm',
        'icons',
        `${lucide[1]}.mjs`
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
