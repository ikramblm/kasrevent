/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b5bdb",
          600: "#2f4bc4",
          700: "#243a9c"
        }
      }
    }
  },
  plugins: []
};
