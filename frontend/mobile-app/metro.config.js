const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add CSS support for NativeWind
const { withNativeWind } = require('nativewind/metro');

module.exports = withNativeWind(config, {
    input: path.resolve(__dirname, './global.css'),
    inlineRem: 16,
});
