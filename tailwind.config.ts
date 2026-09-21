import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b1220",
        surface: "#111a2e",
        border: "#22304a",
        primary: "#22d3ee",
        success: "#34d399",
        warning: "#fbbf24",
        destructive: "#f87171",
        info: "#818cf8",
        muted: "#94a3b8",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
