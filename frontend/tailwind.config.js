// tailwind.config.js
export default {
  content: [
    "./index.html",        // include your main HTML
    "./src/**/*.{js,ts,jsx,tsx}", // include all React components
  ],
  theme: {
    extend: {
      colors: {
        brandBlue: "#1E40AF",   // example custom color
        brandGreen: "#059669",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"], // example custom font
      },
    },
  },
  plugins: [],
};

