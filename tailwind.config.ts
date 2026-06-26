import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — warm & bold (Duolingo-inspired)
        brand: {
          green:  '#58CC02',
          'green-dark': '#46A302',
          amber:  '#FF9600',
          coral:  '#FF4B4B',
          blue:   '#1CB0F6',
          purple: '#CE82FF',
        },
        paper: '#FAF9F6',
        // Neutral palette
        neutral: {
          900: '#1A1A2E',
          700: '#3B3B52',
          500: '#6B6B80',
          400: '#AFAFAF',
          200: '#E5E5EA',
          100: '#F7F7F7',
        },
        // Exam type colors
        exam: {
          cma: '#D97706',
          cfa: '#7C3AED',
          fe:  '#0D9488',
        },
        // Keep primary alias for legacy components
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#58CC02',
          700: '#46A302',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#CE82FF',
          600: '#a855f7',
          700: '#9333ea',
          800: '#7e22ce',
          900: '#6b21a8',
          950: '#3b0764',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        jakarta: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
        'sidebar': '260px',
      },
      borderRadius: {
        '4xl': '2rem',
        'card': '16px',
        'btn': '12px',
      },
      keyframes: {
        'answer-bounce': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',     opacity: '1' },
        },
        'fade-scale-in': {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'pop': {
          '0%':   { transform: 'scale(0.7)', opacity: '0' },
          '70%':  { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        'streak-glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px #FF9600)' },
          '50%':      { filter: 'drop-shadow(0 0 12px #FF9600)' },
        },
        'progress-fill': {
          from: { width: '0%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'answer-bounce': 'answer-bounce 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        'shake':         'shake 0.4s ease-in-out',
        'slide-up':      'slide-up 0.25s ease-out',
        'slide-down':    'slide-down 0.25s ease-out',
        'fade-scale-in': 'fade-scale-in 0.2s ease-out',
        'pop':           'pop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        'streak-glow':   'streak-glow 2s ease-in-out infinite',
        'progress-fill': 'progress-fill 0.8s ease-out',
        'float':         'float 3s ease-in-out infinite',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)',
        'sidebar': '2px 0 8px rgba(0,0,0,0.06)',
        'answer': '0 2px 8px rgba(0,0,0,0.06)',
        'answer-hover': '0 4px 16px rgba(88,204,2,0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
