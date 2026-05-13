/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tahoma', 'Arial', 'sans-serif'],
      },
      colors: {
        executive: {
          950: '#071117',
          900: '#0b1720',
          850: '#10202a',
          800: '#152a35',
          accent: '#2dd4bf',
          gold: '#f3c969',
        },
      },
    },
  },
  plugins: [],
};
