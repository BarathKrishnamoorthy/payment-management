/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
          950: '#3B0764',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'purple-sm': '0 2px 8px -1px rgba(124, 58, 237, 0.08), 0 1px 3px -1px rgba(124, 58, 237, 0.04)',
        'purple-md': '0 8px 20px -3px rgba(124, 58, 237, 0.12), 0 4px 6px -2px rgba(124, 58, 237, 0.06)',
        'purple-lg': '0 20px 30px -4px rgba(124, 58, 237, 0.16), 0 8px 10px -5px rgba(124, 58, 237, 0.08)',
        'purple-glow': '0 0 25px rgba(168, 85, 247, 0.35)',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.9' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

