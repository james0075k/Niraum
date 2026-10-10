import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import type { Stat } from '@/lib/types';
import { StatCard } from './StatCard';

/** Glass stat strip that overlaps the hero's lower edge. */
export function Stats({ stats }: { stats: Stat[] }) {
  return (
    <section id="stats" aria-labelledby="stats-title" className="relative z-10 -mt-16 sm:-mt-20">
      <div className="container-site">
        <h2 id="stats-title" className="sr-only">
          Niraum Metals in numbers
        </h2>
        <RevealGroup as="ul" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <RevealItem as="li" key={s.label}>
              <StatCard stat={s} className="h-full" />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
