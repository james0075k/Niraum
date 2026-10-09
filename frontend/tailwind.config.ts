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
        sans: ['"Manrope Variable"', 'Manrope', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { label: '0.12em' },
      backgroundImage: {
        'copper-gradient': 'linear-gradient(135deg, #8A5236 0%, #DDA27C 50%, #A9663F 100%)',
      },
      boxShadow: {
        'copper-glow': '0 0 0 1px rgb(184 117 74 / 0.35), 0 8px 32px -8px rgb(184 117 74 / 0.45)',
        glass: '0 8px 32px rgb(0 0 0 / 0.25)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      transitionTimingFunction: { brand: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    },
  },
  plugins: [animate],
} satisfies Config;
