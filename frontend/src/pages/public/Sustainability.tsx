import { HardHat, Leaf, Sprout, Trees, Users } from 'lucide-react';
import { Img } from '@/components/common/Img';
import { PageHero } from '@/components/common/PageHero';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { TiltCard } from '@/components/motion/TiltCard';
import { CtaBand } from '@/components/sections/CtaBand';
import { Seo } from '@/components/seo/Seo';
import { banners, photos, siteImages } from '@/content/siteImages';
import { useT } from '@/hooks/useLang';

const COMMITMENTS = [
  { key: 'forest', icon: Trees },
  { key: 'topsoil', icon: Sprout },
  { key: 'rehab', icon: Leaf },
  { key: 'community', icon: Users },
] as const;

/**
 * Primary keyword: "responsible mining Nepal". Sections follow blueprint §5 Sustainability &
 * Safety exactly: forest land, topsoil preservation, progressive rehabilitation, community
 * employment, PPE and safe channel sampling. All are commitments marked [CONFIRM] against the
 * EIA/IEE in the blueprint, so the page says so; no figures are published.
 */
export default function Sustainability() {
  const { t } = useT(['sustainability', 'common']);
  const crumbs = [
    { name: t('common:nav.home'), path: '/' },
    { name: t('common:nav.sustainability'), path: '/sustainability' },
  ];

  return (
    <>
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        crumbs={crumbs}
        image={photos.mossFerns.src}
      />
      <PageHero
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        intro={t('hero.intro')}
        image={banners.crushingPlant}
        crumbs={crumbs}
      />

      <section id="commitments" aria-labelledby="commitments-title" className="section grain">
        <div className="container-site">
          <SectionHeading
            id="commitments-title"
            eyebrow={t('commitments.eyebrow')}
            title={t('commitments.title')}
          />
          <RevealGroup as="ul" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {COMMITMENTS.map(({ key, icon: Icon }) => (
              <RevealItem as="li" key={key}>
                <TiltCard className="glass h-full p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-copper-gradient text-graphite">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-xl">{t(`commitments.${key}.title`)}</h3>
                  <p className="mt-3 text-muted-foreground">{t(`commitments.${key}.body`)}</p>
                </TiltCard>
              </RevealItem>
            ))}
          </RevealGroup>
          <p className="tbc mt-6 inline-block text-xs">{t('commitments.confirm')}</p>
        </div>
      </section>

      <section id="land" aria-labelledby="land-title" className="section bg-muted/40">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="aspect-[4/3] overflow-hidden rounded-[20px] shadow-glass">
            <Img image={photos.hillsideBoulders} sizes="(min-width: 1024px) 50vw, 100vw" />
          </Reveal>
          <SectionHeading
            id="land-title"
            eyebrow={t('land.eyebrow')}
            title={t('land.title')}
            intro={t('land.body')}
          />
        </div>
      </section>

      <section
        id="safety"
        aria-labelledby="safety-title"
        className="texture-hematite section dark bg-graphite text-offwhite"
      >
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="safety-title"
              eyebrow={t('safety.eyebrow')}
              title={t('safety.title')}
              intro={t('safety.body')}
            />
            <HardHat className="h-10 w-10 text-copper-light" aria-hidden="true" />
          </div>
          <Reveal className="aspect-square overflow-hidden rounded-[20px] shadow-glass">
            <Img image={siteImages.channelSafety} sizes="(min-width: 1024px) 50vw, 100vw" />
          </Reveal>
        </div>
      </section>

      <CtaBand
        title={t('cta.title')}
        body={t('cta.body')}
        primaryTo="/contact?topic=supply#inquiry"
        primaryLabel={t('common:cta.bulkSupply')}
      />
    </>
  );
}
