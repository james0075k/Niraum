import { animate, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

/**
 * Counts from 0 to `value` once it scrolls into view. Formats with thousands separators;
 * `decimals` keeps assay figures exact (33.59, not 34).
 */
export function CountUp({
  value,
  suffix = '',
  duration = 1.6,
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = usePrefersReducedMotion();
  const [shown, setShown] = useState(0);
  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(Number(v.toFixed(decimals))),
    });
    return () => controls.stop();
  }, [inView, reduce, value, duration, decimals]);

  return (
    <span ref={ref} className="tabular-nums">
      <span aria-hidden="true">
        {fmt(reduce && inView ? value : shown)}
        {suffix}
      </span>
      <span className="sr-only">
        {fmt(value)}
        {suffix}
      </span>
    </span>
  );
}
