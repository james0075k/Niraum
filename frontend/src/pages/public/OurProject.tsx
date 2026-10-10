import { AlertTriangle, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { Img } from '@/components/common/Img';
import { PageHero } from '@/components/common/PageHero';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { CtaBand } from '@/components/sections/CtaBand';
import { MapGallery } from '@/components/sections/MapGallery';
import { Seo } from '@/components/seo/Seo';
import { siteImages } from '@/content/siteImages';
import { useDeposit } from '@/features/deposits/useDeposit';
import { useT } from '@/hooks/useLang';

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-foreground/10 py-3">
      <dt className="label text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold tabular-nums text-foreground">{children}</dd>
    </div>
  );
}

const ha = (n: number | null) => (n == null ? '—' : `${n} ha`);
const grid = (n: number | null) =>
  n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: 2 });

/** Primary keyword: "Makawanpur iron ore mine" (blueprint §7). */
export default function OurProject() {
  const { t } = useT(['project', 'common']);
  const d = useDeposit();
  const crumbs = [
    { name: t('common:nav.home'), path: '/' },
    { name: t('common:nav.project'), path: '/our-project' },
  ];
  const gallery = [
    siteImages.boulderSwSlope,
    siteImages.specimenDetail,
    siteImages.boulderForest,
    siteImages.oreCloseup,
  ];

  return (
    <>
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        crumbs={crumbs}
        image={siteImages.mapLease.src}
      />
      <PageHero
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        intro={t('hero.intro')}
        image={siteImages.heroSlope}
        crumbs={crumbs}
      />

      <section id="location" aria-labelledby="location-title" className="section grain">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              id="location-title"
              eyebrow={t('location.eyebrow')}
              title={t('location.title')}
            />
            <p className="text-muted-foreground">{d.summary}</p>
          </div>
          <Reveal className="glass p-6 sm:p-8 lg:col-span-7">
            <dl className="grid gap-x-8 sm:grid-cols-2">
              <Fact label={t('location.district')}>{d.location.district}</Fact>
              <Fact label={t('location.municipality')}>
                {d.location.municipality}-{d.location.ward}
              </Fact>
              <Fact label={t('location.province')}>{d.location.province}</Fact>
              <Fact label={t('location.topoSheet')}>{d.location.topoSheet}</Fact>
              <Fact label={t('location.mainPoint')}>
                E {grid(d.location.easting)} · N {grid(d.location.northing)}
              </Fact>
              <Fact label={t('location.spotHeight')}>
                {d.location.spotHeightM == null ? '—' : `${d.location.spotHeightM} m`}
              </Fact>
            </dl>
            <p className="mt-5 flex gap-2 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper-ink" aria-hidden="true" />
              {t('location.gridNote')}
            </p>
          </Reveal>
        </div>
      </section>

      <section id="maps" aria-labelledby="maps-title" className="section bg-muted/40">
        <div className="container-site">
          <SectionHeading id="maps-title" eyebrow={t('maps.eyebrow')} title={t('maps.title')} />
          <MapGallery />
        </div>
      </section>

      <section id="geology" aria-labelledby="geology-title" className="section grain">
        <div className="container-site grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="geology-title"
              eyebrow={t('geology.eyebrow')}
              title={t('geology.title')}
              intro={d.geologySummary}
            />
            <h3 className="label mb-3 text-foreground">{t('geology.zones')}</h3>
            <ul className="flex flex-wrap gap-3">
              {d.areas.map((a) => (
                <li
                  key={a.code}
                  className="glass flex h-16 min-w-16 items-center justify-center px-5 text-2xl font-extrabold text-copper"
                  aria-label={a.label}
                >
                  {a.code}
                </li>
              ))}
            </ul>
          </div>
          <Reveal className="glass p-6 sm:p-8">
            <h3 className="label mb-2 text-foreground">{t('geology.land')}</h3>
            <dl className="grid gap-x-8 sm:grid-cols-2">
              <Fact label={t('geology.survey')}>{ha(d.land.surveyHa)}</Fact>
              <Fact label={t('geology.total')}>{ha(d.land.totalLandUseHa)}</Fact>
              <Fact label={t('geology.quarry')}>{ha(d.land.quarryHa)}</Fact>
              <Fact label={t('geology.topsoil')}>{ha(d.land.topsoilYardHa)}</Fact>
              <Fact label={t('geology.waste')}>{ha(d.land.wasteYardHa)}</Fact>
              <Fact label={t('geology.office')}>{ha(d.land.officeHa)}</Fact>
              <Fact label={t('geology.road')}>{ha(d.land.approachRoadHa)}</Fact>
              <Fact label={t('geology.landType')}>{d.land.landType || '—'}</Fact>
            </dl>
            {!d.land.confirmed && (
              <p className="tbc mt-5 inline-flex items-center gap-2 text-xs">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                {t('geology.unconfirmed')}
              </p>
            )}
          </Reveal>
        </div>
      </section>

      <section
        id="status"
        aria-labelledby="status-title"
        className="texture-hematite section dark bg-graphite text-offwhite"
      >
        <div className="container-site max-w-4xl text-center">
          <SectionHeading
            id="status-title"
            eyebrow={t('status.eyebrow')}
            title={t('status.title')}
            align="center"
            intro={d.statusText}
          />
          <p className="text-sm text-silver">
            {d.consultant.name}, {d.consultant.address}
          </p>
        </div>
      </section>

      <section id="gallery" aria-labelledby="gallery-title" className="section grain">
        <div className="container-site">
          <SectionHeading
            id="gallery-title"
            eyebrow={t('gallery.eyebrow')}
            title={t('gallery.title')}
          />
          <RevealGroup as="ul" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {gallery.map((img) => (
              <RevealItem
                as="li"
                key={img.src}
                className="aspect-[4/5] overflow-hidden rounded-[20px]"
              >
                <Img image={img} sizes="(min-width: 1024px) 25vw, 50vw" />
              </RevealItem>
            ))}
          </RevealGroup>
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
