import { HardHat, Landmark, Leaf, Users } from 'lucide-react';
import { Img } from '@/components/common/Img';
import { PageHero } from '@/components/common/PageHero';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { TiltCard } from '@/components/motion/TiltCard';
import { CtaBand } from '@/components/sections/CtaBand';
import { StatCard } from '@/components/sections/StatCard';
import { Seo } from '@/components/seo/Seo';
import { esgPillars, safetyStats } from '@/content/about';
import { images } from '@/content/images';

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'Sustainability & Safety', path: '/sustainability' },
];
const pillarIcons = [Leaf, Users, HardHat, Landmark];

/** Primary keyword: "responsible mining Nepal". */
export default function Sustainability() {
  return (
    <>
      <Seo
        title="Responsible Mining in Nepal"
        description="How Niraum Metals approaches responsible mining in Nepal: environment, community, safety and governance, with figures published as they are verified."
        crumbs={crumbs}
      />
      <PageHero
        eyebrow="Sustainability & safety"
        title="Responsible mining in Nepal, for generations."
        highlight={[0, 1]}
        intro="Mining changes land. Our job is to change it carefully, keep people safe and leave hillsides stable for the communities that live beside them."
        image={images.hillside}
        crumbs={crumbs}
      />

      <section id="esg" aria-labelledby="esg-title" className="section grain">
        <div className="container-site">
          <SectionHeading
            id="esg-title"
            eyebrow="ESG pillars"
            title="Four commitments, one standard."
            highlight={[0, 1]}
            align="center"
          />
          <RevealGroup as="ul" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {esgPillars.map((p, i) => {
              const Icon = pillarIcons[i] ?? Leaf;
              return (
                <RevealItem as="li" key={p.title}>
                  <TiltCard className="glass h-full p-7">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-copper-gradient text-graphite">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <h3 className="mt-6 text-xl">{p.title}</h3>
                    <p className="mt-3 text-sm text-muted-foreground">{p.body}</p>
                  </TiltCard>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      <section id="environment" aria-labelledby="environment-title" className="section bg-muted/40">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="aspect-[4/3] overflow-hidden rounded-[20px] shadow-glass">
            <Img image={images.mossyOutcrop} sizes="(min-width: 1024px) 50vw, 100vw" />
          </Reveal>
          <div>
            <SectionHeading
              id="environment-title"
              eyebrow="Environment"
              title="Plan for closure on day one."
              highlight={[2]}
              className="!mb-6"
            />
            <Reveal className="prose-site">
              <ul>
                <li>Strip and store topsoil before excavation, then reuse it in rehabilitation.</li>
                <li>Design drainage and sediment control before the first monsoon.</li>
                <li>Stabilise slopes and benches to protect the hillside below.</li>
                <li>Control dust on haul roads and at crushers.</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="community" aria-labelledby="community-title" className="section grain">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="community-title"
              eyebrow="Community"
              title="Good neighbours, by design."
              highlight={[1]}
              className="!mb-6"
            />
            <Reveal className="prose-site">
              <p>
                We consult local communities before work starts, hire locally wherever we can, and
                keep shared roads and water sources safe. Concerns get a named contact and a reply.
              </p>
              <p>
                Community programmes: <span className="tbc">[PLACEHOLDER: Programme details]</span>
              </p>
            </Reveal>
          </div>
          <Reveal className="aspect-[4/3] overflow-hidden rounded-[20px] shadow-glass">
            <Img image={images.channelMarks} sizes="(min-width: 1024px) 50vw, 100vw" />
          </Reveal>
        </div>
      </section>

      <section id="safety" aria-labelledby="safety-title" className="section bg-muted/40">
        <div className="container-site">
          <SectionHeading
            id="safety-title"
            eyebrow="Safety record"
            title="Everyone home, every day."
            highlight={[2, 3]}
            intro="Safety figures will be published once independently verified."
          />
          <RevealGroup as="ul" className="grid gap-4 sm:grid-cols-3">
            {safetyStats.map((s) => (
              <RevealItem as="li" key={s.label}>
                <StatCard stat={s} className="h-full" />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <CtaBand title="Questions about how we work?" />
    </>
  );
}
