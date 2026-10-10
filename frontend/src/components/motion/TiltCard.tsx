import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { PointerEvent, ReactNode } from 'react';
import { useFinePointer, usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

/**
 * 3D tilt (max 6°) + cursor-follow copper glow, desktop pointers only.
 * Touch devices and reduced motion get a plain card.
 */
export function TiltCard({
  children,
  className,
  max = 6,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const fine = useFinePointer();
  const reduce = usePrefersReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 200, damping: 20 });
  const active = fine && !reduce;

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    e.currentTarget.style.setProperty('--mx', `${x * 100}%`);
    e.currentTarget.style.setProperty('--my', `${y * 100}%`);
    if (active) {
      px.set(x);
      py.set(y);
    }
  }
  function onLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div
      className={cn('glow-follow', className)}
      style={active ? { rotateX: rx, rotateY: ry, transformPerspective: 900 } : undefined}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </motion.div>
  );
}
