import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        "collapsible-down": "collapsible-down 0.2s ease-out",
        "collapsible-up": "collapsible-up 0.2s ease-out",
      },
      keyframes: {
        "collapsible-down": {
          "0%": { height: "0px", opacity: "0" },
          "100%": { height: "var(--radix-collapsible-content-height)", opacity: "1" },
        },
        "collapsible-up": {
          "0%": { height: "var(--radix-collapsible-content-height)", opacity: "1" },
          "100%": { height: "0px", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
