/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      colors: {
        primary: {
          50: "#eef3ff",
          100: "#d8e4ff",
          200: "#b5ccff",
          300: "#86a9ff",
          400: "#5e84f2",
          500: "#3f63d8",
          600: "#2c49b3",
          700: "#20378a",
          800: "#182b6a",
          900: "#141f4d",
          950: "#0d1330",
        },
        dark: {
          50: "#eef1f8",
          100: "#d8deeb",
          200: "#bbc5d8",
          300: "#94a4bf",
          400: "#6f809c",
          500: "#55667f",
          600: "#44526a",
          700: "#344055",
          800: "#232d3f",
          900: "#172033",
          950: "#0d1422",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
