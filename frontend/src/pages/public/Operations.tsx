import { Check } from 'lucide-react';
import { Link } from '@/components/common/LangLink';
import { Img } from '@/components/common/Img';
import { PageHero } from '@/components/common/PageHero';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { SplitText } from '@/components/motion/SplitText';
import { CtaBand } from '@/components/sections/CtaBand';
import { serviceIcons } from '@/components/sections/serviceIcons';
import { StatCard } from '@/components/sections/StatCard';
import { Seo } from '@/components/seo/Seo';
import { images } from '@/content/images';
import { useServices } from '@/features/services/useServices';
import { cn } from '@/lib/utils';

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'Operations', path: '/operations' },
];

/** Primary keyword: "iron ore supplier Nepal". One section per operation (anchor = slug). */
export default function Operations() {
  const { data: services } = useServices();

  return (
    <>
      <Seo
        title="Iron Ore Supplier Nepal & Aggregates"
        description="Iron ore supplier in Nepal, plus metal minerals, stone and construction aggregates, and logistics — explored, extracted and delivered by Niraum Metals."
        crumbs={crumbs}
      />
      <PageHero
        eyebrow="Operations"
        title="Iron ore, minerals and aggregates — end to end."
        highlight={[0, 1]}
        intro="An iron ore supplier in Nepal with four connected operations, so quality is controlled from the ground to your gate."
        image={images.sampleChd10}
        crumbs={crumbs}
      >
        <nav aria-label="Operations" className="mt-10 flex flex-wrap gap-2">
          {services.map((s) => (
            <Link
              key={s.slug}
              to={`#${s.slug}`}
              className="glass inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-offwhite hover:border-copper-light"
            >
              {s.title}
            </Link>
          ))}
        </nav>
      </PageHero>

      {services.map((s, i) => {
        const Icon = serviceIcons[s.icon];
        const flip = i % 2 === 1;
        return (
          <section
            key={s.slug}
            id={s.slug}
            aria-labelledby={`${s.slug}-title`}
            className={cn('section grain', flip && 'bg-muted/40')}
          >
            <div className="container-site">
              <div className="grid items-center gap-12 lg:grid-cols-2">
                <div className={cn(flip && 'lg:order-2')}>
                  <Reveal as="p" className="eyebrow mb-5">
                    <Icon className="h-4 w-4" aria-hidden="true" /> Operation 0{i + 1}
                  </Reveal>
                  <SplitText as="h2" id={`${s.slug}-title`} text={s.title} />
                  <Reveal as="p" className="mt-5 text-lg text-muted-foreground" delay={0.1}>
                    {s.body}
                  </Reveal>
                  <RevealGroup as="ul" className="mt-8 space-y-3">
                    {s.highlights.map((h) => (
                      <RevealItem as="li" key={h} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-copper-gradient text-graphite">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        <span className="text-foreground">{h}</span>
                      </RevealItem>
                    ))}
                  </RevealGroup>
                </div>
                <Reveal className={cn('relative', flip && 'lg:order-1')}>
                  <div className="aspect-[4/3] overflow-hidden rounded-[20px] shadow-glass">
                    <Img image={s.image} sizes="(min-width: 1024px) 50vw, 100vw" />
                  </div>
                </Reveal>
              </div>

              <RevealGroup as="ul" className="mt-12 grid gap-4 sm:grid-cols-3">
                {s.stats.map((st) => (
                  <RevealItem as="li" key={st.label}>
                    <StatCard stat={st} className="h-full" />
                  </RevealItem>
                ))}
              </RevealGroup>

              <RevealGroup
                as="ul"
                className="mt-6 grid grid-cols-3 gap-3 sm:gap-4"
                aria-label={`${s.title} gallery`}
              >
                {s.gallery.map((g, gi) => (
                  <RevealItem
                    as="li"
                    key={gi}
                    className="group aspect-square overflow-hidden rounded-2xl sm:aspect-[4/3]"
                  >
                    <Img
                      image={g}
                      sizes="(min-width: 1024px) 25vw, 33vw"
                      className="transition-transform duration-700 ease-brand group-hover:scale-105"
                    />
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </section>
        );
      })}

      <CtaBand title="Need a reliable supply plan?" />
    </>
  );
}
