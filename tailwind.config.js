/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        islamic: {
          green: '#1a5c38',
          gold: '#c9a84c',
          light: '#f0f7f4',
          teal: '#0d7377',
        }
      }
    }
  },
  plugins: [],
};
