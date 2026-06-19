import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        portal: ["var(--font-portal-serif)", "Georgia", "serif"],
      },
      colors: {
        venqor: {
          indigo: "#4F46E5",
          slate: "#0F172A",
        },
      },
    },
  },
  plugins: [],
};
export default config;
