/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'pdv-blue': '#0d214f',
        'pdv-orange': '#ea580c',
      }
    },
  },
  plugins: [],
};