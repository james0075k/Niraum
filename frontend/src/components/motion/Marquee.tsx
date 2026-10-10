import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Infinite CSS marquee (transform only). Content is duplicated once; the copy is
 * hidden from assistive tech. Pauses on hover/focus; static under reduced motion.
 */
export function Marquee({
  children,
  className,
  duration = 40,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
}) {
  return (
    <div
      className={cn(
        'group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]',
        className,
      )}
      style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1 || undefined}
          className="flex min-w-max shrink-0 animate-marquee items-center gap-6 pr-6 group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:animate-none"
        >
          {children}
        </div>
      ))}
    </div>
  );
}
