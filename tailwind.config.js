/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './templates/**/*.html',
    './static/**/*.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        bg: {
          DEFAULT: '#fafafa',
          dark: '#0a0a0a',
        },
        surface: {
          DEFAULT: '#ffffff',
          2: '#f4f4f5',
          dark: '#161616',
          'dark-2': '#1f1f21',
        },
        border: {
          DEFAULT: '#e4e4e7',
          dark: '#27272a',
        },
        ink: {
          DEFAULT: '#18181b',
          muted: '#71717a',
          dark: '#fafafa',
          'muted-dark': '#a1a1aa',
        },
        accent: {
          DEFAULT: '#10b981',
          hover: '#059669',
          dark: '#34d399',
          'hover-dark': '#10b981',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        'card-dark': '0 1px 2px 0 rgb(0 0 0 / 0.4), 0 1px 3px 0 rgb(0 0 0 / 0.5)',
      },
    },
  },
  plugins: [],
};
