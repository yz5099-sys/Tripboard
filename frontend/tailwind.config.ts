import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#102A43",
        mist: "#F8FBFF",
        accent: "#FF6B3D",
        cyan: "#00B7C2",
        sand: "#F4E9DA"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        panel: "0 24px 80px rgba(16, 42, 67, 0.14)"
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.9), transparent 30%), radial-gradient(circle at 80% 0%, rgba(0,183,194,0.12), transparent 22%), radial-gradient(circle at 50% 100%, rgba(255,107,61,0.14), transparent 30%)"
      }
    }
  },
  plugins: []
};

export default config;
