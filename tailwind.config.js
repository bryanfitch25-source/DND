/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base palette -- researched dark-fantasy convention (near-black
        // violet-tinted ground, jewel-tone accents, restrained gold chrome)
        // plus a bespoke "scarlight" accent tying directly into this app's
        // own established lore (lib/dm/worldPrimer.ts): the pale, spectral
        // magic-glow that runs through the Hollow Reach.
        parchment: "#e8dfc8",
        ink: {
          DEFAULT: "#0e0b12", // page background
          900: "#0e0b12",
          800: "#161119", // panel background
          700: "#1e1822", // raised panel / hover
          600: "#2a2230", // borders on dark
        },
        blood: {
          DEFAULT: "#7d1f2e",
          light: "#a8324a",
          dark: "#54141f",
        },
        scarlight: {
          DEFAULT: "#9b8cd9", // spectral violet -- magic, spell slots, glows
          soft: "#c3bbe8",
          dim: "#584f7a",
        },
        gold: {
          DEFAULT: "#b08d57", // chrome / borders / dividers
          bright: "#d9b878",
          dim: "#6b5637",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "serif"],
      },
      boxShadow: {
        glow: "0 0 12px rgba(155, 140, 217, 0.35)",
        "glow-gold": "0 0 10px rgba(217, 184, 120, 0.25)",
        "glow-blood": "0 0 14px rgba(168, 50, 74, 0.4)",
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
