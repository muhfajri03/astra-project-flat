/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        emerald: { astra: "#0A4D3C", forest: "#1B4D3E" },
        mint: "#00E699",
        sage: "#2ECC71",
        mist: "#F8FAFC",
        slate: { astra: "#0F172A" },
        amber: { astra: "#F59E0B" },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "Inter", "system-ui", "sans-serif"],
        han: ['"Noto Sans SC"', '"PingFang SC"', "sans-serif"],
      },
      boxShadow: {
        glass: "0 24px 60px -20px rgba(10,77,60,0.35)",
        glow: "0 12px 30px -8px rgba(0,230,153,0.6)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        rise: {
          from: { opacity: 0, transform: "translateY(14px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(.6)", opacity: 0 },
          "60%": { transform: "scale(1.08)", opacity: 1 },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        rise: "rise .45s cubic-bezier(.2,.8,.2,1) both",
        pop: "pop .5s cubic-bezier(.2,.8,.2,1) both",
      },
    },
  },
  plugins: [],
};
