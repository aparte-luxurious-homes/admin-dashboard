import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#124452",
        background: "#F3F3F3",
      },
    },
  },
  plugins: [],
} satisfies Config;
