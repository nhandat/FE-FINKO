/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#e91e8c',
        'primary-dark': '#c21570',
        gold: '#ffd700',
        'dark-bg': '#0d0d1a',
        'dark-card': '#1a1030',
        'dark-border': '#2d1f4e',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
