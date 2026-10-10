import { animate, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

/** Counts from 0 to `value` once it scrolls into view. Formats with thousands separators. */
export function CountUp({
  value,
  suffix = '',
  duration = 1.6,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = usePrefersReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      <span aria-hidden="true">
        {(reduce && inView ? value : shown).toLocaleString('en-US')}
        {suffix}
      </span>
      <span className="sr-only">
        {value.toLocaleString('en-US')}
        {suffix}
      </span>
    </span>
  );
}
