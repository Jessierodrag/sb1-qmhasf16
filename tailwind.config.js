/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0B0B0F',
          50: '#14141B',
          100: '#1A1A24',
          200: '#22222F',
          300: '#2A2A3A',
          400: '#353545',
          500: '#404050',
          600: '#4F4F62',
          700: '#666678',
          800: '#8A8A9E',
          900: '#B4B4C4',
        },
        rose: {
          DEFAULT: '#FF1B51',
          50: '#FFF0F5',
          100: '#FFE1E9',
          200: '#FFB8CE',
          300: '#FF8FB3',
          400: '#FF5581',
          500: '#FF1B51',
          600: '#E6003D',
          700: '#B30030',
          800: '#800023',
          900: '#4D0015',
        },
        gold: {
          DEFAULT: '#D4AF37',
          50: '#FBF8EF',
          100: '#F7F0DD',
          200: '#EFE0BA',
          300: '#E7D098',
          400: '#DFC075',
          500: '#D4AF37',
          600: '#B8942B',
          700: '#8F7221',
          800: '#665117',
          900: '#3D300D',
        }
      },
      keyframes: {
        'like-button': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
        'like-explosion': {
          '0%': { transform: 'scale(1)', opacity: 1 },
          '50%': { transform: 'scale(1.8)', opacity: 0.5 },
          '100%': { transform: 'scale(2.4)', opacity: 0 },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        'fade-out': {
          '0%': { opacity: 1 },
          '100%': { opacity: 0 }
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        },
        'glow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 }
        }
      },
      animation: {
        'like-button': 'like-button 0.3s ease-in-out',
        'like-explosion': 'like-explosion 0.5s ease-out forwards',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-in',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-in',
        'slide-up': 'slide-up 0.4s ease-out',
        'shimmer': 'shimmer 3s linear infinite',
        'glow': 'glow 2s ease-in-out infinite'
      },
      boxShadow: {
        'glow-rose': '0 0 20px rgba(255, 27, 81, 0.3)',
        'glow-gold': '0 0 20px rgba(212, 175, 55, 0.3)',
        'card': '0 8px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 12px 32px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};