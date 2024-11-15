/** @type {import('./scripts/tailwindcss').Config} */
module.exports = {
  content: [
    "index.html",
    "./dist/*.{html,js}",
    "./src/**/*.{html,js}",
    "./libs/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'indian_red': '#e05759',
        'pigment_green': '#59a154',
        'sky_magenta': '#b17ba0',
        'tangerine': '#f28e34',
        'steel_blue': '#4d78a4',
        'naples_yellow': '#ecca52',
        'mfn_green': '#007C58'
      },
    },
    plugins: [
      require('@tailwindcss/forms'),
      require('@tailwindcss/typography'),
    ],
  }
}

