import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Override all border radius to 0 for squared corners (at top level to fully replace defaults)
    borderRadius: {
      'none': '0',
      'sm': '0',
      'DEFAULT': '0',
      'md': '0',
      'lg': '0',
      'xl': '0',
      '2xl': '0',
      '3xl': '0',
      'full': '9999px', // Keep full for circular elements like dots
    },
    extend: {
      colors: {
        'brand': {
          'lightest': '#f3f3f3',   // Light background
          'light': '#ded8d3',      // Light beige
          'medium': '#918c86',     // Gray
          'dark': '#000000',       // Black (main text)
          'darkest': '#000000',    // Black
          'accent': '#e0c9af',     // Tan/beige accent
          'white': '#ffffff',      // White
        },
      },
      fontFamily: {
        'playfair': ['var(--font-playfair)', 'serif'],
        'nunito': ['var(--font-nunito)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
