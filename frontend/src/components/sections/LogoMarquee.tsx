import { Building2, Construction, Factory, Hexagon, Landmark, Route } from 'lucide-react';
import { Marquee } from '@/components/motion/Marquee';

const icons = [Construction, Factory, Factory, Landmark, Building2, Route];

/**
 * Partner/client marquee. Client logos are not confirmed yet, so it lists the sectors
 * from the Brand Brief. Swap `items` for logo images once partners approve their use.
 */
export function LogoMarquee({ items }: { items: string[] }) {
  return (
    <section
      id="sectors"
      aria-labelledby="sectors-title"
      className="border-y border-foreground/10 py-10 sm:py-12"
    >
      <div className="container-site">
        <h2 id="sectors-title" className="label mb-6 text-center !text-xs text-muted-foreground">
          Supplying the sectors that build Nepal
        </h2>
      </div>
      <Marquee duration={36}>
        {items.map((name, i) => {
          const Icon = icons[i % icons.length] ?? Hexagon;
          return (
            <span
              key={name}
              className="flex items-center gap-3 whitespace-nowrap rounded-full border border-foreground/10 px-5 py-3 text-base font-semibold text-foreground/80"
            >
              <Icon className="h-5 w-5 text-copper-ink" aria-hidden="true" />
              {name}
            </span>
          );
        })}
      </Marquee>
    </section>
  );
}
