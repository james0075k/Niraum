import type { Transition, Variants } from 'framer-motion';

/** Shared motion presets. Durations are short; everything respects reduced motion. */
export const ease = [0.22, 1, 0.36, 1] as const;

export const transition: Transition = { duration: 0.6, ease };

/** Scroll reveal: fade-up 24px + slight blur (spec §4). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition },
};

/** Reduced-motion variant — opacity only. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export const stagger = (staggerChildren = 0.08): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren } },
});

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 24 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.5, ease, delay: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.25, ease } },
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
