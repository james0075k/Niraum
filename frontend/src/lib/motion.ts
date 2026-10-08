import type { Transition, Variants } from 'framer-motion';

/** Shared motion presets. Durations are short; everything respects reduced motion. */
export const ease = [0.22, 1, 0.36, 1] as const;

export const transition: Transition = { duration: 0.6, ease };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition },
};

export const stagger = (staggerChildren = 0.08): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren } },
});

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease } },
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
