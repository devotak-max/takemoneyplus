import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0F766E",
          dark: "#134E4A",
          light: "#5EEAD4",
        },
        ink: {
          DEFAULT: "#0B1220",
          soft: "#1F2937",
          muted: "#64748B",
        },
        canvas: "#F8FAFC",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
