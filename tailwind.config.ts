import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bone: "#F5EFE0",
        paper: "#FFFDF8",
        oatmeal: "#E9DDCE",
        moss: "#244033",
        fern: "#4D6F5D",
        ink: "#221F1A",
        clay: "#B96E45",
        ochre: "#C59A43",
        sea: "#527B81",
        berry: "#8B5364",
        olive: "#7D7C4B",
        umber: "#8A6040",
        stone: "#8A8177"
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        soft: "0 24px 80px rgba(34, 31, 26, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
