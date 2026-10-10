import { ArrowUpRight, Briefcase, Clock, MapPin } from 'lucide-react';
import { Link } from '@/components/common/LangLink';
import { PageHero } from '@/components/common/PageHero';
import { SectionHeading } from '@/components/common/SectionHeading';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { TiltCard } from '@/components/motion/TiltCard';
import { ApplyForm } from '@/components/sections/ApplyForm';
import { Seo } from '@/components/seo/Seo';
import { images } from '@/content/images';
import { useJobs } from '@/features/jobs/useJobs';

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'Careers', path: '/careers' },
];

const reasons = [
  { title: 'Safety first', body: 'Proper PPE, training and the right to stop unsafe work.' },
  { title: 'Real field experience', body: 'Geology, extraction and logistics on working sites.' },
  { title: 'Grow with us', body: 'A young company with room to take on responsibility.' },
];

/** Primary keyword: "mining jobs in Nepal". */
export default function Careers() {
  const { data: jobs } = useJobs();
  const open = jobs.filter((j) => j.isOpen);

  return (
    <>
      <Seo
        title="Mining Jobs in Nepal"
        description="Mining jobs in Nepal with Niraum Metals: geology, extraction, processing and logistics roles. See open positions or send a general application."
        crumbs={crumbs}
      />
      <PageHero
        eyebrow="Careers"
        title="Mining jobs in Nepal with real responsibility."
        highlight={[0, 1]}
        intro="We look for careful, curious people — geologists, operators, engineers and logisticians — who take pride in safe, precise work."
        image={images.fieldGeologist}
        crumbs={crumbs}
      />

      <section id="why-join" aria-labelledby="why-join-title" className="section grain">
        <div className="container-site">
          <SectionHeading
            id="why-join-title"
            eyebrow="Why join us"
            title="Work that matters, done properly."
            highlight={[4]}
          />
          <RevealGroup as="ul" className="grid gap-5 md:grid-cols-3">
            {reasons.map((r) => (
              <RevealItem as="li" key={r.title}>
                <TiltCard className="glass h-full p-7">
                  <h3 className="text-xl">{r.title}</h3>
                  <p className="mt-3 text-muted-foreground">{r.body}</p>
                </TiltCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section
        id="open-positions"
        aria-labelledby="open-positions-title"
        className="section bg-muted/40"
      >
        <div className="container-site">
          <SectionHeading
            id="open-positions-title"
            eyebrow="Open positions"
            title="Current vacancies"
          />
          {open.length ? (
            <ul className="space-y-4">
              {open.map((j) => (
                <li key={j.slug}>
                  <Link
                    to={`/careers/${j.slug}`}
                    className="glass group flex flex-col gap-4 p-6 text-foreground transition-colors hover:border-primary sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>
                      <span className="block text-xl font-semibold">{j.title}</span>
                      <span className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4" aria-hidden="true" /> {j.department}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" aria-hidden="true" /> {j.location}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-4 w-4" aria-hidden="true" /> {j.type}
                        </span>
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-copper-ink">
                      View role <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="glass p-8 text-center">
              <p className="text-lg font-semibold">No vacancies are listed right now.</p>
              <p className="mt-2 text-muted-foreground">
                We still welcome strong candidates — send a general application below.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="apply" aria-labelledby="apply-title" className="section grain">
        <div className="container-site max-w-4xl">
          <SectionHeading
            id="apply-title"
            eyebrow="General application"
            title="Tell us about yourself."
            highlight={[3]}
            intro="Attach your CV as a PDF. We keep it on file and contact you when a suitable role opens."
          />
          <ApplyForm />
        </div>
      </section>
    </>
  );
}
