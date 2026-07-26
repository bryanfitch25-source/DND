/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#e8dfc8",
        ink: "#1b1712",
        blood: "#7a1f1f",
      },
    },
  },
  plugins: [],
};
