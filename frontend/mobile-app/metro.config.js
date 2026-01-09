const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add CSS support for NativeWind
const { withNativeWind } = require('nativewind/metro');

module.exports = withNativeWind(config, {
    input: './global.css',
    inlineRem: 16,
});
