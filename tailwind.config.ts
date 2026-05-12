import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          pink:   '#FF2D78',
          purple: '#B026FF',
          yellow: '#FFD700',
          cyan:   '#00F5FF',
        },
        casino: {
          bg:     '#08040F',
          card:   '#130B24',
          border: '#2D1B4E',
        },
      },
      fontFamily: {
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'count-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'pulse-glow': { '0%,100%': { boxShadow: '0 0 12px #FF2D78' }, '50%': { boxShadow: '0 0 28px #FF2D78, 0 0 48px #FF2D7844' } },
        shimmer: { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
      },
      animation: {
        'count-up': 'count-up 0.3s ease-out',
        'pulse-glow': 'pulse-glow 1.8s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
