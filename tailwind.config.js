/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1e3a5f",
          dark: "#142a45",
        },
        accent: {
          DEFAULT: "#e8a33d",
          dark: "#c8862a",
        },
        surface: "#ffffff",
        border: "#e4dfd5",
        muted: "#78716c",
        bg: "#faf7f2",
        danger: "#b03a2e",
        success: "#3f7d58",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};