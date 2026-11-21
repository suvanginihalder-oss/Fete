/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aqi: {
          good: "#16a34a",
          satisfactory: "#65a30d",
          moderate: "#ca8a04",
          poor: "#ea580c",
          veryPoor: "#dc2626",
          severe: "#7f1d1d"
        }
      }
    },
  },
  plugins: [],
}
