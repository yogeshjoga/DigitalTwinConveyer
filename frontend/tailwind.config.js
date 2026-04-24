/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eefbf3',
          100: '#d6f5e3',
          200: '#b0eacc',
          300: '#7dd8ae',
          400: '#48be8c',
          500: '#27a372',
          600: '#1a835c',
          700: '#16694b',
          800: '#14533c',
          900: '#124532',
        },
        danger:  '#ef4444',
        warning: '#f59e0b',
        info:    '#3b82f6',
        // CSS-variable-driven tokens — values set in index.css per theme
        surface: 'var(--color-surface)',
        panel:   'var(--color-panel)',
        border:  'var(--color-border)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':  'spin 8s linear infinite',
        'belt-move':  'beltMove 2s linear infinite',
      },
      keyframes: {
        beltMove: {
          '0%':   { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '60px 0' },
        },
      },
    },
  },
  plugins: [],
};
