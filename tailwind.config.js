/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#E81B44', // Auxiliar
          600: '#BE0036', // Principal
          700: '#A3002E',
          800: '#991b1b',
          900: '#333333', // Secundario
        },
        primary: {
          DEFAULT: '#BE0036',
          dark: '#333333', // Using secondary as dark variant per index.css
          light: '#E81B44'
        },
        secondary: '#333333',
        aux: {
          red: '#E81B44',
          gray: '#E1E3EA'
        }
      }
    },
  },
  plugins: [],
}