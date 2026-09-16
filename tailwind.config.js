/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bordeaux: { DEFAULT: '#8B1538', dark: '#6E0F2B', soft: '#F3E3E8' },
        crema: '#F7F2EA',
        carta: '#FFFDF9',
        inchiostro: '#2A1F22',
        ottone: { DEFAULT: '#B8893B', soft: '#F1E4CB' },
        verde: { DEFAULT: '#2F6B4F', soft: '#E3EFE8' },
        errore: { DEFAULT: '#B42318', soft: '#FDECEA' },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
