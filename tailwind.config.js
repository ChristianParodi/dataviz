/** @type {import('./scripts/tailwindcss').Config} */
module.exports = {
  content: [
    "index.php",
    "./dist/*.{html,js}",
    "./src/**/*.{html,js}",
    "./libs/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#8d6e63',
          main: '#795548',
          dark: '#5d4037',
        },
        secondary: {
          light: '#8d6e63',
          main: '#40c4ff',
          dark: '#03a9f4',
          darker: '#0288d1',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

