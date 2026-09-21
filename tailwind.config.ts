import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta Lamiex: fundo claro/creme, marca laranja, texto quase-preto quente.
        background: "#faf7f3",
        surface: "#ffffff",
        border: "#e5e0d8",
        foreground: "#211d19",
        primary: "#e8681f",
        "primary-dark": "#c7570f",
        success: "#1e9e52",
        warning: "#b9770e",
        destructive: "#dc3b30",
        info: "#2e76bf",
        muted: "#8d8378",
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
