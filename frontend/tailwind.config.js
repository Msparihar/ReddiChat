/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gray: {
          950: "#0f0f0f",
          900: "#171717",
          850: "#1f1f1f",
          800: "#262626",
          750: "#2d2d2d",
          700: "#3f3f3f",
          600: "#525252",
        },
        blue: {
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        purple: {
          500: "#a855f7",
          600: "#9333ea",
          700: "#7c3aed",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
