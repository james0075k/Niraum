import { Award } from 'lucide-react';
import { Img } from '@/components/common/Img';
import { PageHero } from '@/components/common/PageHero';
import { SectionHeading } from '@/components/common/SectionHeading';
import { TbcText } from '@/components/common/Tbc';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { TiltCard } from '@/components/motion/TiltCard';
import { CtaBand } from '@/components/sections/CtaBand';
import { FounderCard } from '@/components/sections/FounderCard';
import { Seo } from '@/components/seo/Seo';
import { certifications, milestones } from '@/content/about';
import { images } from '@/content/images';
import { siteImages } from '@/content/siteImages';
import { useFounder } from '@/features/team/useTeam';
import { useT } from '@/hooks/useLang';

/** Primary keyword: "Nepal mining company". Copy: blueprint §5 About. */
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
      <Seo title={t('seo.title')} description={t('seo.description')} crumbs={crumbs} />
      <PageHero
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        intro={t('hero.intro')}
        image={siteImages.heroSlope}
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
              <Img image={images.sampleCh8} sizes="(min-width: 1024px) 50vw, 100vw" />
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

      <section id="milestones" aria-labelledby="milestones-title" className="section bg-muted/40">
        <div className="container-site">
          <SectionHeading
            id="milestones-title"
            eyebrow="Milestones"
            title="Our journey so far."
            highlight={[2, 3]}
          />
          <RevealGroup as="ol" className="relative border-l border-foreground/15 pl-8">
            {milestones.map((m, i) => (
              <RevealItem as="li" key={i} className="relative pb-10 last:pb-0">
                <span className="absolute -left-[2.35rem] top-1 h-3 w-3 rounded-full bg-copper-gradient ring-4 ring-background" />
                <p className="label text-copper-ink">
                  <TbcText text={m.year} />
                </p>
                <h3 className="mt-2 text-xl">{m.title}</h3>
                <p className="mt-1 text-muted-foreground">
                  <TbcText text={m.body} />
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section id="certifications" aria-labelledby="certifications-title" className="section grain">
        <div className="container-site">
          <SectionHeading
            id="certifications-title"
            eyebrow="Licences & certifications"
            title="Licensed, registered, accountable."
            highlight={[0]}
            intro="Licence and registration numbers will be published once supplied."
          />
          <RevealGroup as="ul" className="grid gap-5 md:grid-cols-3">
            {certifications.map((c) => (
              <RevealItem as="li" key={c.title} className="glass flex gap-4 p-6">
                <Award className="h-8 w-8 shrink-0 text-copper-ink" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">
                    <TbcText text={c.title} />
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
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
