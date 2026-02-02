import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",

    // IMPORTANT: include the Customization Studio folder
    "./customization-studio/**/*.{js,ts,jsx,tsx,mdx}",

    // Optional: if you use /src in this repo
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Override all border radius to 0 for squared corners (top level override)
    borderRadius: {
      none: "0",
      sm: "0",
      DEFAULT: "0",
      md: "0",
      lg: "0",
      xl: "0",
      "2xl": "0",
      "3xl": "0",
      full: "9999px", // keep full for circular elements
    },
    extend: {
      colors: {
        brand: {
          lightest: "#f3f3f3",
          light: "#ded8d3",
          medium: "#918c86",
          dark: "#000000",
          darkest: "#000000",
          accent: "#475569",
          white: "#ffffff",
        },
      },
      fontFamily: {
        playfair: ["var(--font-playfair)", "serif"],
        nunito: ["var(--font-nunito)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
