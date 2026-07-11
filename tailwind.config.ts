import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

// Spec-defined color scales (systematic 50-900 steps for the 7 core palette groups)
const pichwaiScales = {
  'pichwai-blue': {
    50: '#EEF0FF', 100: '#D9DCFF', 200: '#B3B9FF',
    300: '#8D96FF', 400: '#6673FF', 500: '#3D4FFF',
    600: '#2233CC', 700: '#1A2799', 800: '#111A66', 900: '#090E33',
  },
  'pichwai-saffron': {
    50: '#FFF8EC', 100: '#FFEDC4', 200: '#FFD87A',
    300: '#FFC330', 400: '#FFAA00', 500: '#E08000',
    600: '#B35E00', 700: '#854000', 800: '#5C2A00', 900: '#331600',
  },
  'pichwai-gold': {
    DEFAULT: '#C9933A', light: '#E8C06B', dark: '#8B621A', muted: '#F5E6C8',
  },
  'pichwai-green': {
    50: '#EDFAF0', 100: '#D0F5D9', 200: '#A1EAB3',
    300: '#5DD680', 400: '#22BB55', 500: '#189940',
    600: '#0F7430', 700: '#0A5422', 800: '#063616', 900: '#02180A',
  },
  'pichwai-cream': {
    DEFAULT: '#FFF8E7', warm: '#FFF2D0', dark: '#F0E0B0', parchment: '#EDD9A3',
  },
  'pichwai-rose': {
    DEFAULT: '#C2185B', light: '#F06292', dark: '#880E4F', petal: '#FCE4EC',
  },
  'pichwai-brown': {
    DEFAULT: '#3E2000', light: '#6B3A10', dark: '#1A0D00',
  },
} as const;

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── Spec-defined systematic scales ───────────────────────────────────
        ...pichwaiScales,

        // ─── Extended Pichwai palette (named tokens) ──────────────────────────
        pichwai: {
          'dark-brown':   '#2D1B00',
          'mid-brown':    '#5C3A1E',
          'warm-brown':   '#8B5E3C',
          'light-brown':  '#C4956A',
          'saffron':      '#FF6B00',
          'saffron-deep': '#CC4A00',
          'saffron-light':'#FF9A3C',
          'marigold':     '#F4A825',
          'marigold-pale':'#FAD481',
          'cream':        '#FFF8E7',
          'ivory':        '#FDF3D0',
          'pale-gold':    '#F5E6B3',
          'gold':         '#D4AF37',
          'gold-deep':    '#B8860B',
          'gold-light':   '#EDD97A',
          'peacock':      '#006994',
          'peacock-deep': '#004D70',
          'peacock-teal': '#008080',
          'peacock-light':'#4FB3CF',
          'lotus':        '#C2185B',
          'lotus-deep':   '#880E4F',
          'lotus-light':  '#F48FB1',
          'lotus-pale':   '#FCE4EC',
          'leaf':         '#2E7D32',
          'leaf-light':   '#66BB6A',
          'leaf-pale':    '#C8E6C9',
          'ruby':         '#C62828',
          'ruby-deep':    '#8B0000',
          'ruby-light':   '#EF9A9A',
          'indigo-deep':  '#1A237E',
          'indigo':       '#3949AB',
          'indigo-light': '#9FA8DA',
          'mango':        '#FFC107',
          'mango-deep':   '#FF8F00',
          'warm-white':   '#FFFDF7',
          'warm-gray-50': '#FAF7F2',
          'warm-gray-100':'#F5EFE6',
          'warm-gray-200':'#E8DCCA',
          'warm-gray-300':'#D4BEA3',
          'warm-gray-400':'#B89880',
          'warm-gray-500':'#8C7260',
          'warm-gray-600':'#6B5244',
          'warm-gray-700':'#4A3528',
          'warm-gray-800':'#2D1B00',
          'warm-gray-900':'#1A0F00',
        },

        // ─── Semantic brand tokens ─────────────────────────────────────────────
        brand: {
          primary:    '#D4AF37',
          secondary:  '#006994',
          accent:     '#FF6B00',
          background: '#FFF8E7',
          surface:    '#FDF3D0',
          muted:      '#F5EFE6',
          'muted-fg': '#6B5244',
          border:     '#E8DCCA',
          ring:       '#D4AF37',
          foreground: '#2D1B00',
          destructive:'#C62828',
          success:    '#2E7D32',
          warning:    '#F4A825',
          info:       '#006994',
        },
      },

      // ─── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans:    ['var(--font-poppins)', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        serif:   ['var(--font-playfair)', 'Georgia', 'serif'],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        mono:    ['var(--font-geist-mono)', 'monospace'],
        cinzel:  ['var(--font-cinzel)', 'serif'],
        poppins: ['var(--font-poppins)', 'sans-serif'],
        devanagari: ['var(--font-noto-sans-devanagari)', 'sans-serif'],
      },
      fontSize: {
        'display': ['4.5rem',  { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'hero':    ['3rem',    { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        'title':   ['2rem',    { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'heading': ['1.5rem',  { lineHeight: '1.35' }],
        'subhead': ['1.125rem',{ lineHeight: '1.5' }],
        'body':    ['1rem',    { lineHeight: '1.6' }],
        'small':   ['0.875rem',{ lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
      },

      // ─── Background images ─────────────────────────────────────────────────
      backgroundImage: {
        'pichwai-lotus':    "url('/images/pichwai/lotus-bg.svg')",
        'pichwai-peacock':  "url('/images/pichwai/peacock-divider.svg')",
        'pichwai-floral':   "url('/images/pichwai/floral-corner.svg')",
        'gradient-saffron': 'linear-gradient(135deg, #FF6B00 0%, #F4A825 100%)',
        'gradient-gold':    'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
        'gradient-peacock': 'linear-gradient(135deg, #006994 0%, #004D70 100%)',
        'gradient-lotus':   'linear-gradient(135deg, #C2185B 0%, #880E4F 100%)',
        'gradient-pichwai': 'linear-gradient(180deg, #2D1B00 0%, #5C3A1E 50%, #8B5E3C 100%)',
        'gradient-saffron-spec': 'linear-gradient(135deg, #FFF8E7 0%, #FFE0A0 100%)',
        'gradient-indigo-spec':  'linear-gradient(135deg, #1A2799 0%, #3D4FFF 100%)',
        'gradient-pichwai-spec': 'linear-gradient(135deg, #1A0D00 0%, #3D4FFF 50%, #C9933A 100%)',
      },

      // ─── Shadows ──────────────────────────────────────────────────────────
      boxShadow: {
        'pichwai-sm':  '0 1px 3px rgba(45,27,0,0.12), 0 1px 2px rgba(45,27,0,0.08)',
        'pichwai-md':  '0 4px 12px rgba(45,27,0,0.15), 0 2px 6px rgba(45,27,0,0.10)',
        'pichwai-lg':  '0 10px 30px rgba(45,27,0,0.20), 0 4px 10px rgba(45,27,0,0.12)',
        'pichwai-xl':  '0 20px 60px rgba(45,27,0,0.25), 0 8px 20px rgba(45,27,0,0.15)',
        'pichwai':     '0 4px 24px rgba(62,32,0,0.08), 0 1px 4px rgba(201,147,58,0.15)',
        'card':        '0 2px 16px rgba(62,32,0,0.06)',
        'gold-glow':   '0 0 20px rgba(212,175,55,0.4)',
        'lotus-glow':  '0 0 20px rgba(194,24,91,0.4)',
        'peacock-glow':'0 0 20px rgba(0,105,148,0.4)',
      },

      // ─── Border radius ─────────────────────────────────────────────────────
      borderRadius: {
        'pichwai':    '0.75rem',
        'pichwai-lg': '1.25rem',
        'pichwai-xl': '2rem',
        sm:  'var(--radius-sm)',
        md:  'var(--radius-md)',
        lg:  'var(--radius-lg)',
        xl:  'var(--radius-xl)',
      },

      // ─── Animations ───────────────────────────────────────────────────────
      animation: {
        'lotus-bloom':   'lotusBloom 1.5s ease-in-out',
        'peacock-wave':  'peacockWave 3s ease-in-out infinite',
        'gold-shimmer':  'goldShimmer 2s linear infinite',
        'fade-in-up':    'fadeInUp 0.5s ease-out',
        'fade-in':       'fadeIn 0.3s ease-out',
        'spin-slow':     'spin 3s linear infinite',
        'pulse-slow':    'pulseSlow 2s ease-in-out infinite',
      },
      keyframes: {
        lotusBloom: {
          '0%':   { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '60%':  { transform: 'scale(1.08) rotate(8deg)',  opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)',     opacity: '1' },
        },
        peacockWave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        goldShimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        fadeInUp: {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },

      // ─── Spacing extras ────────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem', '88': '22rem', '120': '30rem',
        '128': '32rem', '144': '36rem',
      },
      zIndex: {
        '60': '60', '70': '70', '80': '80', '90': '90', '100': '100',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
  ],
};

export default config;
