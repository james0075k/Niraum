import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

/**
 * Background parallax: children drift by `offset`% while the section scrolls past.
 * Transform-only (GPU). Static when reduced motion is preferred.
 */
export function Parallax({
  children,
  className,
  offset = 18,
}: {
  children: ReactNode;
  className?: string;
  offset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${offset}%`]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.06, 1.14]);

  return (
    <div ref={ref} className={cn('absolute inset-0 overflow-hidden', className)}>
      <motion.div className="absolute inset-0" style={reduce ? undefined : { y, scale }}>
        {children}
      </motion.div>
    </div>
  );
}
