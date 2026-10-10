import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Brand tokens live as CSS variables in src/styles/globals.css (light + dark).
 * Tailwind references them so shadcn/ui and custom components share one source.
 */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1440px' },
    },
    screens: {
      xs: '320px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
      '4xl': '2560px',
    },
    extend: {
      colors: {
        // Raw brand palette (fixed — sampled from the logo).
        charcoal: '#2B2F36',
        graphite: '#14171C',
        copper: { DEFAULT: '#B8754A', light: '#DDA27C', deep: '#8A5236' },
        silver: '#C9CDD3',
        offwhite: '#F6F4F1',
        rule: '#C27A44',
        'copper-ink': 'hsl(var(--copper-ink))',
        link: 'hsl(var(--link))',
        // Semantic tokens (theme-aware, shadcn/ui contract).
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
      },
      fontFamily: {
        // Mukta renders Devanagari (नेपाली); Latin text keeps Manrope.
        sans: ['"Manrope Variable"', 'Mukta', 'system-ui', 'sans-serif'],
      },
      maxWidth: { '7xl': '80rem' },
      letterSpacing: { label: '0.12em' },
      backgroundImage: {
        'copper-gradient': 'linear-gradient(135deg, #8A5236 0%, #DDA27C 50%, #A9663F 100%)',
      },
      boxShadow: {
        'copper-glow': '0 0 0 1px rgb(184 117 74 / 0.35), 0 8px 32px -8px rgb(184 117 74 / 0.45)',
        glass: 'var(--glass-shadow)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      transitionTimingFunction: { brand: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'scroll-cue': {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '30%': { opacity: '1' },
          '100%': { transform: 'translateY(14px)', opacity: '0' },
        },
      },
      animation: {
        marquee: 'marquee var(--marquee-duration, 40s) linear infinite',
        'scroll-cue': 'scroll-cue 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
