import { motion, useSpring } from 'framer-motion';
import type { PointerEvent, ReactNode } from 'react';
import { useFinePointer, usePrefersReducedMotion } from '@/hooks/useMediaQuery';

/** Wrap a CTA so it leans toward the cursor (desktop only, max 10px). */
export function MagneticButton({
  children,
  strength = 0.3,
  className = 'inline-flex',
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const fine = useFinePointer();
  const reduce = usePrefersReducedMotion();
  const x = useSpring(0, { stiffness: 250, damping: 18 });
  const y = useSpring(0, { stiffness: 250, damping: 18 });
  const active = fine && !reduce;

  function onMove(e: PointerEvent<HTMLSpanElement>) {
    if (!active) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set(Math.max(-10, Math.min(10, (e.clientX - r.left - r.width / 2) * strength)));
    y.set(Math.max(-10, Math.min(10, (e.clientY - r.top - r.height / 2) * strength)));
  }
  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      className={className}
      style={active ? { x, y } : undefined}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.span>
  );
}
