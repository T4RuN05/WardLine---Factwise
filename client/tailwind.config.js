/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        surface: {
          DEFAULT: 'var(--surface)',
          pure: 'var(--surface-pure)',
          soft: 'var(--surface-soft-blue)',
        },
        sidebar: {
          DEFAULT: 'var(--brand-ink)',
          raised: 'var(--sidebar-raised)',
        },
        brand: {
          DEFAULT: 'var(--brand-blue)',
          pink: 'var(--brand-pink)',
          ink: 'var(--brand-ink)',
          blue: 'var(--brand-blue)',
          white: 'var(--surface)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        line: 'var(--line)',
        success: {
          DEFAULT: 'var(--success)',
          soft: 'var(--success-soft)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          soft: 'var(--warning-soft)',
        },
        pending: {
          DEFAULT: 'var(--pending)',
          soft: 'var(--pending-soft)',
        },
        info: {
          DEFAULT: 'var(--info)',
          soft: 'var(--info-soft)',
        },
        fever: {
          DEFAULT: 'var(--fever)',
          soft: 'var(--fever-soft)',
        },
        critical: {
          DEFAULT: 'var(--critical)',
          soft: 'var(--critical-soft)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'app': 'var(--radius-app)',
        'sidebar': 'var(--radius-sidebar)',
        'card': 'var(--radius-card)',
        'control': 'var(--radius-control)',
      },
    },
  },
  plugins: [],
};
