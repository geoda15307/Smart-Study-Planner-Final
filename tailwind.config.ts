import type { Config } from "tailwindcss";

function themeColor(variable: string) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

const config: Config = {
  darkMode: "class",
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        soft: themeColor("--color-background"),
        surface: themeColor("--color-surface"),
        slate: {
          50: themeColor("--color-slate-50"),
          100: themeColor("--color-slate-100"),
          200: themeColor("--color-slate-200"),
          400: themeColor("--color-slate-400"),
          500: themeColor("--color-slate-500"),
          600: themeColor("--color-slate-600"),
          700: themeColor("--color-slate-700"),
          800: "#1e293b",
          900: themeColor("--color-slate-900"),
          950: "#020617"
        },
        primary: {
          50: themeColor("--color-primary-50"),
          100: themeColor("--color-primary-100"),
          500: themeColor("--color-primary-500"),
          600: themeColor("--color-primary-600"),
          700: themeColor("--color-primary-700")
        }
      },
      boxShadow: {
        soft: "0 16px 45px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        card: "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;
