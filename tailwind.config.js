/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'system-ui', 'monospace'],
        retro: ['"VT323"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        grass: {
          DEFAULT: '#5cb85c',
          dark: '#3a8a3a',
          light: '#7dd47d',
        },
        dirt: {
          DEFAULT: '#8b5a2b',
          dark: '#5d3a1a',
          light: '#b07a48',
        },
        sky: {
          day: '#6fb7ff',
          dusk: '#f5a663',
          night: '#0d1b3d',
        },
        lava: '#ff7a18',
        diamond: '#5ee6e0',
        gold: '#ffd34e',
        redstone: '#d63a3a',
        emerald: '#17c964',
      },
      boxShadow: {
        pixel: '4px 4px 0 0 rgba(0,0,0,0.6)',
        'pixel-sm': '2px 2px 0 0 rgba(0,0,0,0.6)',
        'pixel-lg': '6px 6px 0 0 rgba(0,0,0,0.6)',
        'pixel-gold': '4px 4px 0 0 #b8860b',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(-3deg)' },
          '50%': { transform: 'translateY(-14px) rotate(3deg)' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        drift: {
          '0%': { transform: 'translateX(-10%)' },
          '100%': { transform: 'translateX(110vw)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        bob: 'bob 2.4s ease-in-out infinite',
        wiggle: 'wiggle 0.6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        pop: 'pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'drift-slow': 'drift 60s linear infinite',
      },
    },
  },
  plugins: [],
};
