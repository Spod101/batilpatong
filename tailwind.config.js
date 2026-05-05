/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"IBM Plex Sans"', 'ui-sans-serif'],
      },
      colors: {
        ink: {
          950: '#0b1220',
        },
      },
      boxShadow: {
        glow: '0 20px 60px -30px rgba(14, 116, 144, 0.45)',
      },
    },
  },
  plugins: [],
}
