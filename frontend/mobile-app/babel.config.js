module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // NativeWind v4 - CRITICAL FOR TAILWIND TO WORK
            'nativewind/babel',
            'react-native-reanimated/plugin', // Must be last
        ],
    };
};
