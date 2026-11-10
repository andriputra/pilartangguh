import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F5F2ED",
        sand: "#EAE6DE",
        ink: "#161616",
        charcoal: "#2A2A2A",
        brand: {
          DEFAULT: "#F26B21",
          dark: "#D85A14",
          light: "#FFF1E6",
        },
        muted: "#8A867F",
        line: "#DDD8CF",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,22,22,.05), 0 8px 24px rgba(22,22,22,.06)",
        lift: "0 16px 40px rgba(22,22,22,.14)",
        polaroid: "0 24px 60px rgba(22,22,22,.18)",
      },
      maxWidth: {
        site: "72rem",
      },
    },
  },
  plugins: [],
};
export default config;
