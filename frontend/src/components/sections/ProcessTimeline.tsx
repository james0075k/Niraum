import { motion, useScroll, useSpring } from 'framer-motion';
import { useRef } from 'react';
import { SectionHeading } from '@/components/common/SectionHeading';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface Step {
  title: string;
  body: string;
}

interface Heading {
  eyebrow?: string;
  title?: string;
  highlight?: number[];
  intro?: string;
}

/**
 * Process steps with a copper line that fills as you scroll. Defaults: the Phase 3 four-step
 * process; Phase 4.5 Home passes the six field-to-supply steps and its own heading.
 */
export function ProcessTimeline({ steps, heading = {} }: { steps: Step[]; heading?: Heading }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section id="process" aria-labelledby="process-title" className="section grain">
      <div className="container-site">
        <SectionHeading
          id="process-title"
          eyebrow={heading.eyebrow ?? 'Our process'}
          title={heading.title ?? 'From hillside to delivery.'}
          highlight={heading.highlight ?? [3]}
          align="center"
          intro={
            heading.intro ??
            'A closed loop of measurement and control. Every stage hands clean data to the next.'
          }
        />
        <div ref={ref} className="relative">
          {/* Track: horizontal on desktop, vertical on mobile. */}
          <div className="absolute left-[1.375rem] top-0 h-full w-px bg-foreground/15 lg:left-0 lg:top-[1.375rem] lg:h-px lg:w-full" />
          <motion.div
            aria-hidden="true"
            className="absolute left-[1.375rem] top-0 h-full w-px origin-top bg-copper-gradient lg:hidden"
            style={reduce ? undefined : { scaleY: progress }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute left-0 top-[1.375rem] hidden h-px w-full origin-left bg-copper-gradient lg:block"
            style={reduce ? undefined : { scaleX: progress }}
          />
          <RevealGroup
            as="ol"
            className={cn(
              'relative grid gap-10 lg:gap-8',
              steps.length > 4 ? 'lg:grid-cols-6' : 'lg:grid-cols-4',
            )}
            gap={0.12}
          >
            {steps.map((s, i) => (
              <RevealItem as="li" key={s.title} className="relative pl-16 lg:pl-0 lg:pt-16">
                <span className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-background text-sm font-bold text-copper-ink shadow-copper-glow">
                  0{i + 1}
                </span>
                <h3 className="text-xl">{s.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground sm:text-base">{s.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
