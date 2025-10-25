import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        night: "#050109",
        neonBlue: "#35f0ff",
        neonPink: "#ff5dc2",
        neonPurple: "#8a5fff",
        neonRed: "#ff3b5c",
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(53, 240, 255, 0.45)",
        innerGlow: "inset 0 0 12px rgba(255, 61, 124, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
