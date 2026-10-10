import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion/Reveal';
import { SplitText } from '@/components/motion/SplitText';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  /** id for the <h2>; the parent <section> points aria-labelledby at it. */
  id: string;
  eyebrow?: string;
  title: string;
  /** Word indexes in copper. */
  highlight?: number[];
  intro?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  children?: ReactNode;
}

/** The single H2 of a section: eyebrow + split-text heading + optional intro. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  highlight,
  intro,
  align = 'left',
  className,
  children,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-12 flex flex-col gap-5 lg:mb-16',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow && (
        <Reveal as="p" className={cn('eyebrow', align === 'center' && 'justify-center')}>
          {eyebrow}
        </Reveal>
      )}
      <SplitText as="h2" id={id} text={title} highlight={highlight} className="max-w-3xl" />
      {intro && (
        <Reveal
          as="p"
          delay={0.1}
          className={cn(
            'max-w-2xl text-base text-muted-foreground sm:text-lg',
            align === 'center' && 'mx-auto',
          )}
        >
          {intro}
        </Reveal>
      )}
      {children}
    </div>
  );
}
