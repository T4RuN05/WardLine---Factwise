/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        line: 'var(--line)',
        brand: {
          DEFAULT: 'var(--brand)',
          light: '#2d84c2',
          dark: '#144160',
        },
        fever: 'var(--fever)',
        warn: 'var(--warn)',
        ok: 'var(--ok)',
        muted: 'var(--muted)',
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'ui-sans-serif', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
