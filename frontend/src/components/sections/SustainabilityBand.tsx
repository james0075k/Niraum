import { ArrowRight, HardHat, Leaf, Users } from 'lucide-react';
import { Link } from '@/components/common/LangLink';
import { Img } from '@/components/common/Img';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Parallax } from '@/components/motion/Parallax';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/button';
import { photos } from '@/content/siteImages';
import { useT } from '@/hooks/useLang';

/** `key` → `sustainability:band.<key>` (blueprint §5 Sustainability & Safety). */
const points = [
  { icon: HardHat, key: 'safety' },
  { icon: Leaf, key: 'environment' },
  { icon: Users, key: 'community' },
] as const;

/** Full-bleed photo band; glass panel carries the copy. Always dark tokens over the photo. */
export function SustainabilityBand() {
  const { t } = useT('sustainability');
  return (
    <section
      id="sustainability"
      aria-labelledby="sustainability-title"
      className="dark relative isolate overflow-hidden bg-graphite py-24 text-offwhite sm:py-32"
    >
      <Parallax className="-z-20" offset={14}>
        <Img image={photos.hillsideBoulders} sizes="100vw" />
      </Parallax>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />

      <div className="container-site grid gap-10 lg:grid-cols-12">
        <div className="glass p-7 sm:p-10 lg:col-span-7">
          <SectionHeading
            id="sustainability-title"
            eyebrow={t('band.eyebrow')}
            title={t('band.title')}
            intro={t('band.intro')}
            className="!mb-8"
          />
          <RevealGroup as="ul" className="grid gap-5 sm:grid-cols-3">
            {points.map(({ icon: Icon, key }) => (
              <RevealItem as="li" key={key}>
                <Icon className="h-6 w-6 text-copper-light" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">{t(`band.${key}.title`)}</h3>
                <p className="mt-1 text-sm text-silver">{t(`band.${key}.body`)}</p>
              </RevealItem>
            ))}
          </RevealGroup>
          <Button asChild variant="glass" className="mt-8">
            <Link to="/sustainability">
              {t('band.link')} <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
