import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Space/Background colors
        'space-dark': '#0a0a1a',
        'space-mid': '#1a1a2e',
        'space-light': '#2d2d44',
        'card-dark': '#1a1a2e',
        'background-dark': '#0d0d1a',
        
        // Accent colors
        'accent-purple': '#8b5cf6',
        'accent-blue': '#3b82f6',
        'accent-pink': '#ec4899',
        'accent-gold': '#fbbf24',
        'primary': '#8b5cf6',
        
        // Text colors
        'text-primary': '#f9fafb',
        'text-secondary': '#9ca3af',
        'text-muted': '#6b7280',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        'lg': '1rem',
        'xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'glow': '0 0 40px 10px rgba(139, 92, 246, 0.2), 0 0 60px 20px rgba(236, 72, 153, 0.1)',
        'glow-blue': '0 0 40px 10px rgba(59, 130, 246, 0.2)',
      },
      animation: {
        'star-fall': 'star-fall 50s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in',
        'fade-in-up': 'fadeInUp 1s ease-out forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'star-fall': {
          '0%': { transform: 'translateY(-200px)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-sky': 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #2d1b4e 100%)',
        'gradient-purple': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        'gradient-blue': 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

export default config

