import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { fade, fadeUp, stagger } from '@/lib/motion';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

type Tag = 'div' | 'section' | 'ul' | 'ol' | 'li' | 'article' | 'header' | 'p' | 'span' | 'figure';

interface RevealProps {
  children: ReactNode;
  className?: string;
  as?: Tag;
  delay?: number;
}

/** Fade-up 24px + blur when the element enters the viewport (opacity-only if reduced motion). */
export function Reveal({ children, className, as = 'div', delay = 0 }: RevealProps) {
  const reduce = usePrefersReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      variants={reduce ? fade : fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ delay }}
    >
      {children}
    </Comp>
  );
}

/** Parent that staggers its <RevealItem> children. */
export function RevealGroup({
  children,
  className,
  as = 'div',
  gap = 0.08,
}: RevealProps & { gap?: number }) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      variants={stagger(gap)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
    >
      {children}
    </Comp>
  );
}

export function RevealItem({ children, className, as = 'div' }: RevealProps) {
  const reduce = usePrefersReducedMotion();
  const Comp = motion[as];
  return (
    <Comp className={className} variants={reduce ? fade : fadeUp}>
      {children}
    </Comp>
  );
}
