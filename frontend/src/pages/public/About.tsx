import { Img } from '@/components/common/Img';
import { PageHero } from '@/components/common/PageHero';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { TiltCard } from '@/components/motion/TiltCard';
import { CtaBand } from '@/components/sections/CtaBand';
import { FounderCard } from '@/components/sections/FounderCard';
import { Seo } from '@/components/seo/Seo';
import { banners, photos } from '@/content/siteImages';
import { useFounder } from '@/features/team/useTeam';
import { useT } from '@/hooks/useLang';
import { personLd } from '@/lib/seo';

/**
 * Primary keyword: "Nepal mining company". Sections follow blueprint §5 About exactly: story,
 * mission + values, founder card, consultant credit, then the bulk-supply CTA.
 */
export default function About() {
  const { t } = useT(['about', 'common']);
  const founder = useFounder();
  const crumbs = [
    { name: t('common:nav.home'), path: '/' },
    { name: t('common:nav.about'), path: '/about' },
  ];
  const values = (['safety', 'integrity', 'community', 'longTerm'] as const).map((k) => ({
    title: t(`values.${k}`),
    body: t(`values.${k}Body`),
  }));

  return (
    <>
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        crumbs={crumbs}
        image={photos.cliffGeologist.src}
        jsonLd={[personLd(founder)]}
      />
      <PageHero
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        intro={t('hero.intro')}
        image={banners.crushingPlant}
        crumbs={crumbs}
      />

      <section id="story" aria-labelledby="story-title" className="section grain">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="story-title"
              eyebrow={t('story.eyebrow')}
              title={t('story.title')}
              className="!mb-8"
            />
            <Reveal className="prose-site">
              <p>{t('story.p1')}</p>
              <p>{t('story.p2')}</p>
            </Reveal>
          </div>
          <Reveal className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-[20px] shadow-glass">
              <Img image={photos.sampleCh8} sizes="(min-width: 1024px) 50vw, 100vw" />
            </div>
            <div className="glass absolute -bottom-6 -left-4 max-w-[16rem] p-5 sm:-left-8">
              <p className="text-sm font-semibold text-foreground">{t('home:hero.tagline')}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="mission" aria-labelledby="mission-title" className="section bg-muted/40">
        <div className="container-site">
          <SectionHeading
            id="mission-title"
            eyebrow={t('values.eyebrow')}
            title={t('values.title')}
            align="center"
            intro={`${t('values.mission')}: ${t('values.missionBody')}`}
          />
          <RevealGroup as="ul" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <RevealItem as="li" key={v.title}>
                <TiltCard className="glass h-full p-7">
                  <h3 className="text-2xl text-copper">{v.title}</h3>
                  <p className="mt-4 text-muted-foreground">{v.body}</p>
                </TiltCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section id="leadership" aria-labelledby="leadership-title" className="section grain">
        <div className="container-site max-w-5xl">
          <SectionHeading
            id="leadership-title"
            eyebrow={t('founder.eyebrow')}
            title={t('founder.title')}
          />
          <FounderCard member={founder} />
        </div>
      </section>

      <section
        id="partner"
        aria-labelledby="partner-title"
        className="texture-hematite section dark bg-graphite text-offwhite"
      >
        <div className="container-site max-w-4xl">
          <SectionHeading
            id="partner-title"
            eyebrow={t('partner.eyebrow')}
            title={t('partner.title')}
            intro={t('partner.body')}
          />
        </div>
      </section>

      <CtaBand
        title={t('home:cta.title')}
        body={t('home:cta.body')}
        primaryTo="/contact?topic=supply#inquiry"
        primaryLabel={t('common:cta.bulkSupply')}
      />
    </>
  );
}
