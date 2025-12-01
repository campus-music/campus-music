/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#E84A5F",
        background: "#0a0a0a",
        surface: "#141414",
        "surface-elevated": "#1a1a1a",
        border: "#2a2a2a",
        muted: "#737373",
      },
    },
  },
  plugins: [],
};
