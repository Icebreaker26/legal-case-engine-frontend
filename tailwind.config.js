/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        enel: { 
          blue: '#002E6D', 
          magenta: '#E20074', 
          orange: '#FF7900', 
          green: '#00A300' 
        }
      }
    },
  },
  plugins: [],
}
