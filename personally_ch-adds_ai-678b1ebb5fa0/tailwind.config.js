/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0891b2', // cyan-600
        },
        secondary: {
          DEFAULT: '#6b7280', // gray-500
        },
      },
    },
  },
  plugins: [],
} 