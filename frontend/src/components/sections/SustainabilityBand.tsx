import { ArrowRight, HardHat, Leaf, Users } from 'lucide-react';
import { Link } from '@/components/common/LangLink';
import { Img } from '@/components/common/Img';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/button';
import { photos } from '@/content/siteImages';
import { useT } from '@/hooks/useLang';

/** `key` → `sustainability:band.<key>` (blueprint §5 Sustainability & Safety). */
const points = [
  { icon: HardHat, key: 'safety' },
  { icon: Leaf, key: 'environment' },
  { icon: Users, key: 'community' },
] as const;

/**
 * Home → Sustainability & Safety. Split layout: commitments on the left, Niraum's own CH-B-1
 * channel-sampling photo in a framed card on the right (stacks under the copy on phones).
 * Normal theme tokens, so it alternates with the dark bands around it.
 */
export function SustainabilityBand() {
  const { t } = useT('sustainability');
  return (
    <section id="sustainability" aria-labelledby="sustainability-title" className="section grain">
      <div className="container-site grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SectionHeading
            id="sustainability-title"
            eyebrow={t('band.eyebrow')}
            title={t('band.title')}
            intro={t('band.intro')}
            className="!mb-8"
          />
          <RevealGroup as="ul" className="grid gap-6 sm:grid-cols-3">
            {points.map(({ icon: Icon, key }) => (
              <RevealItem as="li" key={key} className="glass p-5">
                <Icon className="h-6 w-6 text-copper-ink" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">{t(`band.${key}.title`)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(`band.${key}.body`)}</p>
              </RevealItem>
            ))}
          </RevealGroup>
          <Button asChild size="lg" className="mt-8">
            <Link to="/sustainability">
              {t('band.link')} <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <Reveal as="figure" className="lg:col-span-5">
          <div className="overflow-hidden rounded-[20px] shadow-glass">
            <Img
              image={photos.chb1Field}
              className="aspect-square"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
          </div>
          <figcaption className="mt-3 text-sm text-muted-foreground">
            {t('band.photoCaption')}
          </figcaption>
        </Reveal>
      </div>
    </section>
  );
}
