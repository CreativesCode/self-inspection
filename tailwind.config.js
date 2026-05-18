/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from "tailwindcss-animate";

module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      animation: {
        spin: "spin 1s linear infinite",
      },
      keyframes: {
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      colors: {
        primary: {
          50: "var(--accent-50)",
          100: "var(--accent-100)",
          200: "var(--accent-200)",
          300: "var(--accent-300)",
          400: "var(--accent-400)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
          800: "var(--accent-800)",
          900: "var(--accent-900)",
        },
        secondary: {
          50: "#F6F2EF",
          100: "#E9E1DC",
          200: "#D2C6BE",
          300: "#ACA3A0",
          400: "#928783",
          500: "#786B66",
          600: "#675C58",
          700: "#574E4A",
          800: "#483F3C",
          900: "#39322F",
        },
        // Surfaces light
        bg: "#FAF7F4",
        "bg-2": "#F3EEE9",
        surface: "#FFFFFF",
        ink: "#1B1614",
        "ink-2": "#4A4340",
        "ink-3": "#857974",
        // Surfaces dark
        "dark-bg": "#15110F",
        "dark-bg-2": "#1E1815",
        "dark-surface": "#241D1A",
        "dark-ink": "#F6F2EF",
        "dark-ink-2": "#C7BDB8",
        // Status
        ok: "#2F9E6A",
        warn: "#E8A33D",
        bad: "var(--accent-500)",
        info: "#4F75E1",
        // Status accents (deeper variants for text on tinted bg)
        "ok-700": "#1F7A50",
        "warn-700": "#9C6B19",
        "info-700": "#2D4FB3",
      },
      borderColor: {
        hairline: "rgba(27,22,20,0.08)",
        "hairline-dark": "rgba(255,255,255,0.08)",
      },
      borderRadius: {
        DEFAULT: "16px",
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "28px",
        "2xl": "32px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(27,22,20,0.04), 0 12px 32px -16px rgba(27,22,20,0.12)",
        "soft-lg": "0 1px 2px rgba(27,22,20,0.05), 0 24px 64px -24px rgba(27,22,20,0.18)",
        "soft-dark": "0 1px 2px rgba(0,0,0,0.4), 0 24px 60px -20px rgba(0,0,0,0.5)",
        "brand-glow":
          "0 4px 14px -4px rgba(var(--accent-rgb),0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
        "brand-glow-lg": "0 12px 28px -8px rgba(var(--accent-rgb),0.6)",
      },
      backgroundImage: {
        "grad-brand": "var(--grad-brand)",
        "grad-brand-soft": "var(--grad-brand-soft)",
        "grad-warm": "linear-gradient(135deg, #FAF7F4 0%, #F3EEE9 100%)",
        "grad-border-glow": "var(--grad-border-glow)",
        "grad-border-glow-dark": "var(--grad-border-glow-dark)",
        "grad-ok": "linear-gradient(135deg, #2F9E6A, #6BC79A)",
        "grad-warn": "linear-gradient(135deg, #E8A33D, #F4C66E)",
        "grad-bad": "var(--grad-bad)",
        "grad-info": "linear-gradient(135deg, #4F75E1, #8FA9F0)",
      },
      letterSpacing: {
        tightest: "-0.035em",
        tighter: "-0.03em",
        tight: "-0.025em",
        wider: "0.04em",
        widest: "0.08em",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
