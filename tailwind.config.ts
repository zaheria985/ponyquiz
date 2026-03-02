import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "var(--surface)",
          muted: "var(--surface-muted)",
          subtle: "var(--surface-subtle)",
        },
        interactive: {
          DEFAULT: "var(--interactive)",
          hover: "var(--interactive-hover)",
          light: "var(--interactive-light)",
          medium: "var(--interactive-medium)",
          border: "var(--interactive-border)",
        },
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        "text-muted": "var(--text-muted)",
        border: "var(--border)",
        "border-light": "var(--border-light)",
        success: {
          bg: "var(--success-bg)",
          text: "var(--success-text)",
          solid: "var(--success-solid)",
          border: "var(--success-border)",
        },
        warning: {
          bg: "var(--warning-bg)",
          text: "var(--warning-text)",
          solid: "var(--warning-solid)",
          border: "var(--warning-border)",
        },
        error: {
          bg: "var(--error-bg)",
          text: "var(--error-text)",
          border: "var(--error-border)",
        },
        brand: {
          DEFAULT: "var(--brand)",
          contrast: "var(--brand-contrast)",
        },
        overlay: "var(--overlay)",
        input: {
          bg: "var(--input-bg)",
          border: "var(--input-border)",
          text: "var(--input-text)",
          placeholder: "var(--input-placeholder)",
          "focus-ring": "var(--input-focus-ring)",
        },
        sidebar: {
          bg: "var(--sidebar-bg)",
          text: "var(--sidebar-text)",
          hover: "var(--sidebar-hover)",
          "active-bg": "var(--sidebar-active-bg)",
          "active-text": "var(--sidebar-active-text)",
        },
      },
      backgroundColor: {
        app: "var(--app-bg)",
      },
      textColor: {
        app: "var(--app-text)",
      },
      borderRadius: {
        card: "var(--radius-card)",
      },
      boxShadow: {
        card: "0 1px 3px var(--shadow-color)",
        "card-lg": "0 4px 12px var(--shadow-color)",
      },
    },
  },
  plugins: [],
} satisfies Config;
