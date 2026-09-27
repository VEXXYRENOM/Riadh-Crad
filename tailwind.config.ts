import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Typography ──────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-outfit)', ...fontFamily.sans],
        display: ['var(--font-cormorant)', ...fontFamily.serif],
        mono: ['var(--font-jetbrains-mono)', ...fontFamily.mono],
      },

      // ── Brand Color Palette ─────────────────────────────────
      colors: {
        // Primary brand gold spectrum
        gold: {
          50:  '#FFF9EC',
          100: '#FFF1CE',
          200: '#F9D98A',
          300: '#EFC06A',
          400: '#DEA644',
          500: '#C58A27',
          600: '#A86E1C',
          700: '#875317',
          800: '#633A11',
          900: '#44260B',
          950: '#2D1807',
        },
        // Dark / obsidian scale
        obsidian: {
          50:  '#FBF8F3',
          100: '#F2ECE3',
          200: '#E1D7CA',
          300: '#C5B7A7',
          400: '#978777',
          500: '#746456',
          600: '#5B4C41',
          700: '#46382F',
          800: '#30251F',
          900: '#1C1917',
          950: '#100D0C',
        },
        // Backgrounds
        pearl: '#FAF8F5',
        royal: '#FFFFFF',   // Crisp Royal White
        sand: {
          50:  '#FDFBF7',
          100: '#FAF8F5',
          200: '#F3ECE0',
          300: '#E4D6C2',
          400: '#CFBA98',
        },
        dune: {
          900: '#1C1917',
          950: '#0C0A09',
        },
      },

      // ── Custom Gold Gradients ────────────────────────────────
      backgroundImage: {
        // Primary fluid gold — used as bg-fluid-gold
        'fluid-gold':
          'linear-gradient(135deg, #FCF6BA 0%, #D4AF37 30%, #AA771C 60%, #FCF6BA 80%, #D4AF37 100%)',

        // Animated shimmer variant (apply with animate-shimmer)
        'gold-shimmer':
          'linear-gradient(105deg, transparent 40%, rgba(212,175,55,0.4) 50%, transparent 60%)',

        // Card back gradient
        'gold-card':
          'linear-gradient(145deg, #0F172A 0%, #1E293B 40%, #0F172A 70%, #2A1F00 100%)',

        // Soft ambient for surfaces
        'gold-ambient':
          'radial-gradient(ellipse at top left, rgba(212,175,55,0.12) 0%, transparent 60%)',

        // Tier-specific gradients
        'tier-bronze':
          'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)',
        'tier-silver':
          'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
        'tier-gold':
          'linear-gradient(135deg, #FCF6BA 0%, #D4AF37 50%, #AA771C 100%)',
        'tier-platinum':
          'linear-gradient(135deg, #E8E8E8 0%, #B0C4DE 40%, #C0C0C0 100%)',

        // Pearl ivory page background
        'pearl-gradient':
          'linear-gradient(180deg, #FFFFFF 0%, #FAF7F2 55%, #F3EDE4 100%)',
        'noir-card':
          'linear-gradient(145deg, #0C0A09 0%, #1C1917 35%, #241D15 70%, #0C0A09 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'riyadh-mesh':
          'radial-gradient(at 20% 20%, rgba(212,175,55,0.09) 0%, transparent 50%), radial-gradient(at 80% 0%, rgba(28,25,23,0.06) 0%, transparent 45%), radial-gradient(at 50% 100%, rgba(212,175,55,0.05) 0%, transparent 55%)',
      },

      // ── Box Shadows ──────────────────────────────────────────
      boxShadow: {
        'gold-glow':    '0 12px 35px -10px rgba(212,175,55,0.40)',
        'gold-glow-lg': '0 20px 60px -15px rgba(212,175,55,0.50)',
        'gold-inner':   'inset 0 1px 0 rgba(212,175,55,0.20)',
        'gold-ring':    '0 0 0 2px rgba(212,175,55,0.60)',
        'card-lift':    '0 8px 30px -8px rgba(15,23,42,0.25)',
        'glass':        '0 4px 24px -4px rgba(15,23,42,0.08)',
      },

      // ── Border Radius ────────────────────────────────────────
      borderRadius: {
        'card': '1.25rem',     // 20px — premium card corners
        'modal': '1.5rem',     // 24px — luxury modal
        'chip':  '624.9375rem', // pill shape
      },

      // ── Keyframes & Animations ───────────────────────────────
      keyframes: {
        // Gold shimmer sweep across surfaces
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        // NFC pulse ring
        'nfc-pulse': {
          '0%, 100%': { transform: 'scale(1)',   opacity: '1' },
          '50%':       { transform: 'scale(1.4)', opacity: '0' },
        },
        // Gold glow breathe
        'gold-breathe': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212,175,55,0.20)' },
          '50%':       { boxShadow: '0 0 40px rgba(212,175,55,0.50)' },
        },
        // Fade up entrance
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Scale in (modal open)
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Ticker float (points counter)
        'count-up': {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
        // Rotating border for luxury loaders
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // Tier badge entrance
        'tier-reveal': {
          '0%':   { clipPath: 'inset(0 100% 0 0)' },
          '100%': { clipPath: 'inset(0 0% 0 0)' },
        },
      },
      animation: {
        'shimmer':      'shimmer 2.5s linear infinite',
        'nfc-pulse':    'nfc-pulse 1.8s ease-in-out infinite',
        'gold-breathe': 'gold-breathe 3s ease-in-out infinite',
        'fade-up':      'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':     'scale-in 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'count-up':     'count-up 0.4s ease-out both',
        'spin-slow':    'spin-slow 4s linear infinite',
        'tier-reveal':  'tier-reveal 0.6s cubic-bezier(0.16,1,0.3,1) both',
      },

      // ── Backdrop Blur ────────────────────────────────────────
      backdropBlur: {
        'glass': '20px',
        'heavy': '40px',
      },

      // ── Transition timing ────────────────────────────────────
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-gold': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
