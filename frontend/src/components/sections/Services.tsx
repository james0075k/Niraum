import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionHeading } from '@/components/common/SectionHeading';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { TiltCard } from '@/components/motion/TiltCard';
import type { Service } from '@/lib/types';
import { serviceIcons } from './serviceIcons';

/** "What we do" — four glass cards with tilt + cursor glow. */
export function Services({ services }: { services: Service[] }) {
  return (
    <section id="what-we-do" aria-labelledby="what-we-do-title" className="section grain">
      <div className="container-site">
        <SectionHeading
          id="what-we-do-title"
          eyebrow="What we do"
          title="Four operations. One standard of work."
          highlight={[4, 5, 6]}
          intro="From the first sample on a hillside to the last load at your plant, every step is planned, measured and safe."
        />
        <RevealGroup as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => {
            const Icon = serviceIcons[s.icon];
            return (
              <RevealItem as="li" key={s.slug}>
                <TiltCard className="glass h-full">
                  <Link
                    to={`/operations#${s.slug}`}
                    className="group flex h-full flex-col p-6 text-foreground sm:p-7"
                  >
                    <span className="flex items-center justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-copper-gradient text-graphite">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </span>
                      <span className="label text-muted-foreground">0{i + 1}</span>
                    </span>
                    <h3 className="mt-8 text-xl">{s.title}</h3>
                    <p className="mt-3 flex-1 text-sm text-muted-foreground">{s.summary}</p>
                    <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-copper-ink">
                      Learn more
                      <ArrowUpRight
                        className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </TiltCard>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
