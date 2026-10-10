import { Award, Linkedin, UserRound } from 'lucide-react';
import { Img } from '@/components/common/Img';
import { PageHero } from '@/components/common/PageHero';
import { SectionHeading } from '@/components/common/SectionHeading';
import { TbcText } from '@/components/common/Tbc';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { TiltCard } from '@/components/motion/TiltCard';
import { CtaBand } from '@/components/sections/CtaBand';
import { Seo } from '@/components/seo/Seo';
import { Badge } from '@/components/ui/badge';
import { certifications, milestones, values } from '@/content/about';
import { images } from '@/content/images';
import { useTeam } from '@/features/team/useTeam';

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
];

/** Primary keyword: "Nepal mining company". */
export default function About() {
  const { data: team } = useTeam();

  return (
    <>
      <Seo
        title="About Our Nepal Mining Company"
        description="Meet Niraum Metals, a Nepal mining company in Lalitpur supplying iron ore, metal minerals and aggregates with safety and engineering discipline."
        crumbs={crumbs}
      />
      <PageHero
        eyebrow="About Niraum Metals"
        title="A Nepal mining company built to last."
        highlight={[5, 6]}
        intro="Rooted in Lalitpur, working across Nepal. We find, extract and deliver the minerals that roads, plants and buildings depend on."
        image={images.fieldGeologist}
        crumbs={crumbs}
      />

      <section id="story" aria-labelledby="story-title" className="section grain">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="story-title"
              eyebrow="Our story"
              title="Engineering first. Promises second."
              highlight={[0, 1]}
              className="!mb-8"
            />
            <Reveal className="prose-site">
              <p>
                Niraum Metals Pvt. Ltd. is a Nepal mining company registered in Lalitpur-13. We work
                in iron ore, metal minerals and stone aggregates — the raw materials of Nepal&apos;s
                growth.
              </p>
              <p>
                Our approach is simple: measure before you move. Every project starts with geology,
                sampling and honest data, and every tonne leaves with paperwork you can trust.
              </p>
              <p>
                Founded in <TbcText text="[PLACEHOLDER: Founding year]" />. Our story will be filled
                in as the company shares its history.
              </p>
            </Reveal>
          </div>
          <Reveal className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-[20px] shadow-glass">
              <Img image={images.sampleCh8} sizes="(min-width: 1024px) 50vw, 100vw" />
            </div>
            <div className="glass absolute -bottom-6 -left-4 max-w-[16rem] p-5 sm:-left-8">
              <p className="text-sm font-semibold text-foreground">
                Strength Forged For Generations
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Our motto, and our standard.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="mission" aria-labelledby="mission-title" className="section bg-muted/40">
        <div className="container-site">
          <SectionHeading
            id="mission-title"
            eyebrow="Mission, vision & values"
            title="What guides every decision."
            highlight={[2, 3]}
            align="center"
          />
          <RevealGroup as="ul" className="grid gap-5 md:grid-cols-3">
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
        <div className="container-site">
          <SectionHeading
            id="leadership-title"
            eyebrow="Leadership"
            title="The people accountable."
            highlight={[2]}
            intro="Leadership profiles will appear here once confirmed."
          />
          <RevealGroup as="ul" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m) => (
              <RevealItem as="li" key={`${m.name}-${m.order}`}>
                <article className="glass group relative h-full overflow-hidden" tabIndex={0}>
                  <div className="relative aspect-[4/5] bg-gradient-to-br from-charcoal to-graphite">
                    {m.photo ? (
                      <Img image={m.photo} sizes="(min-width: 1024px) 25vw, 50vw" />
                    ) : (
                      <UserRound
                        className="absolute inset-0 m-auto h-20 w-20 text-silver/40"
                        aria-hidden="true"
                      />
                    )}
                    {/* Bio reveals on hover/focus; always visible on touch. */}
                    <div className="dark absolute inset-0 flex items-end bg-gradient-to-t from-black/85 via-black/55 to-transparent p-5 transition-opacity duration-500 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus:opacity-100">
                      <p className="text-sm text-silver">
                        <TbcText text={m.bio} />
                      </p>
                    </div>
                    {m.isSample && (
                      <Badge className="absolute left-3 top-3 bg-black/50 text-copper-light">
                        Placeholder
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2 p-5">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        <TbcText text={m.name} />
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <TbcText text={m.role} />
                      </p>
                    </div>
                    {m.linkedin && (
                      <a
                        href={m.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${m.name} on LinkedIn`}
                        className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-accent"
                      >
                        <Linkedin className="h-4 w-4" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
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

      <CtaBand />
    </>
  );
}
