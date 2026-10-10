import { PageHero } from '@/components/common/PageHero';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { FounderCard } from '@/components/sections/FounderCard';
import { InquiryForm } from '@/components/sections/InquiryForm';
import { Seo } from '@/components/seo/Seo';
import { siteImages } from '@/content/siteImages';
import { useAssaySummary } from '@/features/assay/useAssay';
import { useDeposit } from '@/features/deposits/useDeposit';
import { useProduct } from '@/features/products/useProducts';
import { useFounder } from '@/features/team/useTeam';
import { useT } from '@/hooks/useLang';
import { formatPct } from '@/lib/format';

/** Primary keyword: "mining investment Nepal". No financial projections (blueprint §5). */
export default function Investors() {
  const { t } = useT(['investors', 'common']);
  const deposit = useDeposit();
  const product = useProduct();
  const assay = useAssaySummary();
  const founder = useFounder();
  const crumbs = [
    { name: t('common:nav.home'), path: '/' },
    { name: t('common:nav.investors'), path: '/investors' },
  ];
  const o = assay.overall;
  const overview = [
    { label: t('overview.deposit'), value: deposit.name },
    {
      label: t('overview.location'),
      value: `${deposit.location.municipality}-${deposit.location.ward}, ${deposit.location.district}, ${deposit.location.province}`,
    },
    { label: t('overview.product'), value: `${product.name} (${product.chemicalFormula})` },
    {
      label: t('overview.grade'),
      value: o ? `${formatPct(o.Fe2O3)}% Fe₂O₃ · ${formatPct(o.Fe)}% Fe · ${o.thicknessM} m` : '—',
    },
    { label: t('overview.status'), value: deposit.statusText },
  ];
  const milestones = [
    { when: '2026', text: t('milestones.est') },
    { when: '✓', text: t('milestones.studies') },
    { when: t('milestones.now'), text: t('milestones.development') },
  ];

  return (
    <>
      <Seo title={t('seo.title')} description={t('seo.description')} crumbs={crumbs} />
      <PageHero
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        intro={t('hero.intro')}
        image={siteImages.boulderSwSlope}
        crumbs={crumbs}
      />

      <section id="overview" aria-labelledby="overview-title" className="section grain">
        <div className="container-site max-w-5xl">
          <SectionHeading
            id="overview-title"
            eyebrow={t('overview.eyebrow')}
            title={t('overview.title')}
          />
          <Reveal className="glass p-6 sm:p-8">
            <dl className="divide-y divide-foreground/10">
              {overview.map((r) => (
                <div key={r.label} className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-6">
                  <dt className="label text-muted-foreground">{r.label}</dt>
                  <dd className="font-semibold tabular-nums sm:col-span-2">{r.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section id="milestones" aria-labelledby="milestones-title" className="section bg-muted/40">
        <div className="container-site">
          <SectionHeading
            id="milestones-title"
            eyebrow={t('milestones.eyebrow')}
            title={t('milestones.title')}
          />
          <RevealGroup as="ol" className="grid gap-4 md:grid-cols-3">
            {milestones.map((m) => (
              <RevealItem as="li" key={m.text} className="glass p-6">
                <p className="text-3xl font-extrabold text-copper">{m.when}</p>
                <p className="mt-3 text-foreground">{m.text}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section id="founder" aria-labelledby="founder-title" className="section grain">
        <div className="container-site max-w-5xl">
          <SectionHeading
            id="founder-title"
            eyebrow={t('founder.eyebrow')}
            title={t('founder.title')}
          />
          <FounderCard member={founder} />
        </div>
      </section>

      <section id="investor-deck" aria-labelledby="deck-title" className="section bg-muted/40">
        <div className="container-site grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              id="deck-title"
              eyebrow={t('deck.eyebrow')}
              title={t('deck.title')}
              intro={t('deck.body')}
            />
          </div>
          <div className="lg:col-span-7">
            <InquiryForm topic="investor_deck" defaultBuyerType="investor" />
          </div>
        </div>
      </section>
    </>
  );
}
