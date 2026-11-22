/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="light"]', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        carbon: {
          950: '#040405',
          900: '#060708', // Deep Carbon Obsidian
          850: '#0d0f12', // Elevated Chamfered Surface
          800: '#14171c', // Raised surface
          750: '#1c2026', // Active surface
          700: '#262b33',
        },
        stealth: {
          950: '#040405',
          900: '#060708',
          850: '#0d0f12',
          800: '#14171c',
          750: '#1c2026',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        volt: {
          DEFAULT: '#D4FF00', // Acid Volt Signature Accent
          400: '#e1ff33',
          500: '#D4FF00',
          600: '#b8dc00',
          glow: 'rgba(212, 255, 0, 0.4)',
        },
        crimson: {
          DEFAULT: '#FF2A4B', // Telemetry Crimson Accent
          400: '#ff4d68',
          500: '#FF2A4B',
          600: '#e01838',
          glow: 'rgba(255, 42, 75, 0.4)',
        },
        titanium: '#F4F6F8',
        muted: '#8A94A6',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Anton"', '"Bebas Neue"', '"Syne"', 'sans-serif'],
        headline: ['"Anton"', '"Syne"', 'sans-serif'],
      },
      boxShadow: {
        'hairline': '0 0 0 1px rgba(255, 255, 255, 0.08)',
        'volt-glow': '0 0 25px rgba(212, 255, 0, 0.35)',
        'crimson-glow': '0 0 25px rgba(255, 42, 75, 0.35)',
        'card-carbon': '0 16px 40px -10px rgba(0, 0, 0, 0.9)',
      },
    },
  },
  plugins: [],
}
