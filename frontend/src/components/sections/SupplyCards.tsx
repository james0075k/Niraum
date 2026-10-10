import { Factory, FlaskConical, Flame } from 'lucide-react';
import { Img } from '@/components/common/Img';
import { SectionHeading } from '@/components/common/SectionHeading';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { photos } from '@/content/siteImages';
import { useT } from '@/hooks/useLang';

const ITEMS = [
  { key: 'cement', icon: Factory },
  { key: 'foundry', icon: Flame },
  { key: 'assay', icon: FlaskConical },
] as const;

/** Home → "What we supply" (blueprint §5): cement ore, foundry evaluation lots, assay support. */
export function SupplyCards() {
  const { t } = useT('home');
  return (
    <section id="supply" aria-labelledby="supply-title" className="section grain">
      <div className="container-site grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SectionHeading
            id="supply-title"
            eyebrow={t('supply.eyebrow')}
            title={t('supply.title')}
            className="!mb-8"
          />
          <RevealGroup as="ul" className="grid gap-4">
            {ITEMS.map(({ key, icon: Icon }) => (
              <RevealItem as="li" key={key} className="glass flex gap-5 p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-copper-gradient text-graphite">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg">{t(`supply.${key}.title`)}</h3>
                  <p className="mt-2 text-muted-foreground">{t(`supply.${key}.body`)}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
        <div className="aspect-[4/3] overflow-hidden rounded-[20px] shadow-glass lg:col-span-5">
          <Img image={photos.sampleCh8} sizes="(min-width: 1024px) 40vw, 100vw" />
        </div>
      </div>
    </section>
  );
}
