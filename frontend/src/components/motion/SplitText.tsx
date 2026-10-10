import { motion } from 'framer-motion';
import { ease } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

interface SplitTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'p';
  className?: string;
  id?: string;
  /** Words (0-based) rendered with the copper gradient. */
  highlight?: number[];
  /** Animate on mount (hero) instead of when scrolled into view. */
  immediate?: boolean;
  delay?: number;
}

/**
 * Word-by-word heading reveal. The full sentence stays in the DOM as real text
 * (screen readers and crawlers read it normally); reduced motion renders it static.
 */
export function SplitText({
  text,
  as = 'h2',
  className,
  id,
  highlight = [],
  immediate,
  delay = 0,
}: SplitTextProps) {
  const reduce = usePrefersReducedMotion();
  const Tag = as;
  const words = text.split(' ');

  if (reduce) {
    return (
      <Tag id={id} className={className}>
        {words.map((w, i) => (
          <span key={i} className={cn(highlight.includes(i) && 'text-copper')}>
            {w}
            {i < words.length - 1 && ' '}
          </span>
        ))}
      </Tag>
    );
  }

  // Above-the-fold headings (immediate): CSS animation, so the prerendered text paints at
  // first paint instead of waiting for hydration (keeps LCP close to FCP).
  if (immediate) {
    return (
      <Tag id={id} className={className}>
        {words.map((w, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <span
              className={cn(
                'inline-block duration-700 ease-brand animate-in fade-in slide-in-from-bottom-full fill-mode-both motion-reduce:animate-none',
                highlight.includes(i) && 'text-copper',
              )}
              style={{ animationDelay: `${(delay + i * 0.07).toFixed(2)}s` }}
            >
              {w}
            </span>
            {i < words.length - 1 && ' '}
          </span>
        ))}
      </Tag>
    );
  }

  const trigger = {
    whileInView: 'visible' as const,
    viewport: { once: true, margin: '0px 0px -10% 0px' },
  };

  return (
    <Tag id={id} className={className}>
      <motion.span
        className="inline"
        initial="hidden"
        {...trigger}
        transition={{ staggerChildren: 0.07, delayChildren: delay }}
      >
        {words.map((w, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <motion.span
              className={cn('inline-block', highlight.includes(i) && 'text-copper')}
              variants={{
                hidden: { y: '105%', opacity: 0 },
                visible: { y: '0%', opacity: 1, transition: { duration: 0.7, ease } },
              }}
            >
              {w}
            </motion.span>
            {i < words.length - 1 && ' '}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
