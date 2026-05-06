/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mars: {
          dark: '#1a0b08',
          base: '#c1440e',
          light: '#e77d11'
        },
        cyber: {
          cyan: '#00f3ff',
          blue: '#0066ff'
        }
      }
    },
  },
  plugins: [],
}
