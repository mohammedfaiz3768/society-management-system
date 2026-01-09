/** @type {import('tailwindcss').Config} */
module.exports = {
    // FIXED: Include app directory for Expo Router
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./src/**/*.{js,jsx,ts,tsx}"
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {},
    },
    plugins: [],
}
