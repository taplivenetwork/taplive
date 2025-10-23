/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Custom neon colors for your tech theme
        'neon-blue': 'hsl(var(--neon-blue))',
        'neon-purple': 'hsl(var(--neon-purple))',
        'neon-cyan': 'hsl(var(--neon-cyan))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'Menlo', 'monospace'],
      },
      boxShadow: {
        '2xs': 'var(--shadow-2xs)',
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'DEFAULT': 'var(--shadow)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
      letterSpacing: {
        normal: 'var(--tracking-normal)',
      },
      spacing: {
        '0.5': 'var(--spacing)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'tech-scan': 'tech-scan 3s ease-in-out infinite',
        'order-pulse': 'order-pulse 3s ease-in-out infinite',
        'data-flow': 'data-flow 8s linear infinite',
        'tech-shimmer': 'tech-shimmer 2s ease-in-out infinite',
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite alternate',
        'circuit-flow': 'circuit-flow 10s linear infinite',
        'holographic-shift': 'holographic-shift 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'global-pulse': 'global-pulse 15s ease-in-out infinite',
        'tech-line-glow': 'tech-line-glow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 5px hsl(266, 85%, 58%), 0 0 10px hsl(266, 85%, 58%), 0 0 15px hsl(266, 85%, 58%, 0.5), 0 0 20px hsl(187, 85%, 53%, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 10px hsl(266, 85%, 58%), 0 0 20px hsl(266, 85%, 58%), 0 0 30px hsl(266, 85%, 58%, 0.7), 0 0 40px hsl(187, 85%, 53%, 0.5)',
          },
        },
        'tech-scan': {
          '0%, 100%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' },
        },
        'order-pulse': {
          '0%, 100%': {
            opacity: '0.6',
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 hsl(187, 85%, 53%, 0.4)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.1)',
            boxShadow: '0 0 0 15px hsl(187, 85%, 53%, 0)',
          },
        },
        'data-flow': {
          '0%': { transform: 'translateX(-100%) translateY(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(200vw) translateY(-20px)', opacity: '0' },
        },
        'tech-shimmer': {
          '0%, 100%': { transform: 'translateX(-100%) skewX(-45deg)' },
          '50%': { transform: 'translateX(200%) skewX(-45deg)' },
        },
        'neon-pulse': {
          '0%, 100%': {
            textShadow: '0 0 5px hsl(266, 85%, 58%), 0 0 10px hsl(266, 85%, 58%), 0 0 15px hsl(266, 85%, 58%), 0 0 20px hsl(266, 85%, 58%)',
          },
          '50%': {
            textShadow: '0 0 2px hsl(266, 85%, 58%), 0 0 5px hsl(266, 85%, 58%), 0 0 8px hsl(266, 85%, 58%), 0 0 12px hsl(266, 85%, 58%)',
          },
        },
        'circuit-flow': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
        'holographic-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'global-pulse': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
        'tech-line-glow': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'circuit-pattern': `
          linear-gradient(90deg, hsl(266, 85%, 58%, 0.1) 1px, transparent 1px),
          linear-gradient(180deg, hsl(187, 85%, 53%, 0.1) 1px, transparent 1px)
        `,
        'holographic': `
          linear-gradient(
            45deg,
            hsl(266, 85%, 58%, 0.1) 0%,
            hsl(187, 85%, 53%, 0.1) 25%,
            hsl(280, 100%, 70%, 0.1) 50%,
            hsl(200, 100%, 50%, 0.1) 75%,
            hsl(266, 85%, 58%, 0.1) 100%
          )
        `,
      },
      backgroundSize: {
        'circuit': '20px 20px',
        'holographic': '400% 400%',
        'global-network': '400px 300px',
      },
    },
  },
  plugins: [],
}

