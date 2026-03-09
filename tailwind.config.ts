import type { Config } from "tailwindcss";

const config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "360px",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
