/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
        'micro': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.14em' }],
        xs: ['0.75rem', { lineHeight: '1.125rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.875rem', { lineHeight: '1.375rem' }],
        lg: ['1rem', { lineHeight: '1.5rem' }],
        xl: ['1.125rem', { lineHeight: '1.625rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em' }],
        '3xl': ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
        '5xl': ['3rem', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.035em' }],
        '7xl': ['4.75rem', { lineHeight: '0.98', letterSpacing: '-0.04em' }],
        '8xl': ['6rem', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
      },
      letterSpacing: {
        eyebrow: '0.14em',
      },
      colors: {
        // Paper — the body bg. A true off-white with a barely-there warm tint,
        // not the "saturated cream" AI default. Stays chroma-light so text reads.
        paper: {
          DEFAULT: '#fbfaf7',
          deep: '#f3f1ea',
          edge: '#ece8de',
        },
        // Ink — typographic scale. Each step has a real reason to exist.
        ink: {
          DEFAULT: '#1c1a17',
          soft:   '#3d3a35',
          muted:  '#6f6a62',
          faint:  '#a39e95',
        },
        // Rules — borders / hairlines.
        rule: {
          DEFAULT: '#e3ddd0',
          strong:  '#cbc3b1',
        },
        // Cinnabar — the red ink. The single saturated accent on the page.
        cinnabar: {
          50:  '#fbeeea',
          200: '#f1c3b7',
          300: '#e89987',
          500: '#c2412a',
          600: '#a8331f',
          700: '#8a291a',
        },
        // Moss — the positive / "in balance" tone.
        moss: {
          50:  '#ebf2e8',
          500: '#5a7a4a',
          700: '#3e5632',
        },
        // Saffron — the caution / "watch" tone.
        saffron: {
          50:  '#fbf2e0',
          500: '#c98c2b',
          700: '#8d5e15',
        },
        // Inkwell — the neutral ledger text.
        inkwell: {
          50:  '#f0eee9',
          500: '#7a7468',
          700: '#3d3a35',
        },
        // Surface system (kept for any non-ledger pages).
        surface: {
          DEFAULT: '#ffffff',
          muted: '#faf8f3',
          sunken: '#f3f1ea',
        },
        line: {
          DEFAULT: '#e3ddd0',
          strong: '#cbc3b1',
        },
        canvas: '#fbfaf7',

        // ---- Landing palette (additive; existing tokens untouched) ----
        // Warm ivory page bg with a touch more amber than generic cream.
        ivory: {
          DEFAULT: '#F7F1E1',
          soft:    '#F2EAD3',
          deep:    '#EADFC2',
        },
        // Charcoal — slightly warmer than ink, used for the landing type.
        charcoal: {
          DEFAULT: '#2A241D',
          soft:    '#4A4239',
          muted:   '#7C7060',
          faint:   '#A89D8B',
        },
        // Coral — primary CTA. Real terracotta family, not the AI pastel-coral.
        coral: {
          50:  '#FCEBE7',
          100: '#F8D2C8',
          200: '#F0AE9C',
          500: '#E26B4D',
          600: '#C95940',
          700: '#A8472F',
        },
        // Forest — success / approved accents.
        forest: {
          50:  '#E6F0EA',
          100: '#C9DDD0',
          200: '#A4C7AE',
          500: '#3F7259',
          600: '#345E48',
          700: '#284A39',
        },
        // Teal — secondary success / report accent.
        teal: {
          50:  '#DBEEEC',
          100: '#B6DAD6',
          200: '#84C2BC',
          500: '#2E8078',
          600: '#266963',
          700: '#1D524D',
        },
        // Amber — pending / budget warning accents.
        amber: {
          50:  '#FAEBD2',
          100: '#F2D3A4',
          200: '#E5B470',
          500: '#D88A41',
          600: '#BA6F2D',
          700: '#8E5520',
        },
        // Sage / mint / peach — soft visual panels behind content.
        sage: {
          50:  '#EBF1E7',
          100: '#D6E2CC',
          200: '#B8CFA9',
        },
        mint: {
          50:  '#E2EFE9',
          100: '#C5DDD5',
          200: '#9BC8BB',
        },
        peach: {
          50:  '#FAE6D5',
          100: '#F2CFAE',
          200: '#E8B081',
        },
        // Warm subtle borders for white cards on tinted panels.
        warmborder: {
          DEFAULT: '#EBE0C5',
          strong:  '#D8C9A2',
        },
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        md: '0.625rem',
        lg: '0.75rem',
        xl: '1rem',
        pill: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(28, 26, 23, 0.05)',
        sm: '0 1px 3px 0 rgba(28, 26, 23, 0.07), 0 1px 2px -1px rgba(28, 26, 23, 0.04)',
        md: '0 4px 12px -2px rgba(28, 26, 23, 0.08)',
        pop: '0 18px 40px -16px rgba(28, 26, 23, 0.18), 0 2px 6px -2px rgba(28, 26, 23, 0.06)',
        page: '0 1px 0 0 rgba(28, 26, 23, 0.04), 0 12px 32px -10px rgba(28, 26, 23, 0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.28s ease-out forwards',
        'draw': 'draw 1.4s ease-out forwards',
        'tick': 'tick 0.4s ease-out 1.2s both',
        'shimmer': 'shimmer 1.6s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        draw: {
          '0%': { strokeDashoffset: '200' },
          '100%': { strokeDashoffset: '0' },
        },
        tick: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};
