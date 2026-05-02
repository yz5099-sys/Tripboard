import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F8EEDB",
        sand: "#E9D7B9",
        blush: "#E9C9C3",
        mist: "#D8D6CF",
        cocoa: "#6F5E53"
      }
    },
  },
  plugins: [],
};
export default config;
