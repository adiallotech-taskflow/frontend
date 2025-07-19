/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f4fb',
          100: '#e4e7f6',
          200: '#ced3ee',
          300: '#acb6e2',
          400: '#8390d3',
          500: '#6470c5',
          600: '#3f51b5', // Primary color
          700: '#3544a3',
          800: '#2d3881',
          900: '#283269',
          950: '#1b2041',
        },
        accent: {
          50: '#fef2f4',
          100: '#fde2e8',
          200: '#fbcbd7',
          300: '#f7a8bb',
          400: '#f1759a',
          500: '#e8457b',
          600: '#ff4081', // Accent color
          700: '#d01661',
          800: '#b01355',
          900: '#96134f',
          950: '#530528',
        },
      },
    },
  },
  plugins: [],
}