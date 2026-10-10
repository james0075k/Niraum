import { ArrowRight, HardHat, Leaf, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Img } from '@/components/common/Img';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Parallax } from '@/components/motion/Parallax';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/button';
import { siteImages } from '@/content/siteImages';

const points = [
  { icon: HardHat, title: 'Safety', body: 'PPE, training and the right to stop unsafe work.' },
  { icon: Leaf, title: 'Environment', body: 'Topsoil saved, drainage controlled, land restored.' },
  { icon: Users, title: 'Community', body: 'Local hiring and early, honest consultation.' },
];

/** Full-bleed photo band; glass panel carries the copy. Always dark tokens over the photo. */
export function SustainabilityBand() {
  return (
    <section
      id="sustainability"
      aria-labelledby="sustainability-title"
      className="dark relative isolate overflow-hidden bg-graphite py-24 text-offwhite sm:py-32"
    >
      <Parallax className="-z-20" offset={14}>
        <Img image={siteImages.southernSlope} sizes="100vw" />
      </Parallax>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />

      <div className="container-site grid gap-10 lg:grid-cols-12">
        <div className="glass p-7 sm:p-10 lg:col-span-7">
          <SectionHeading
            id="sustainability-title"
            eyebrow="Sustainability & safety"
            title="Responsible mining, measured every day."
            highlight={[0, 1]}
            intro="Responsible mining in Nepal means leaving hillsides stable, water clean and every worker safe. We plan for that from the first survey."
            className="!mb-8"
          />
          <RevealGroup as="ul" className="grid gap-5 sm:grid-cols-3">
            {points.map(({ icon: Icon, title, body }) => (
              <RevealItem as="li" key={title}>
                <Icon className="h-6 w-6 text-copper-light" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-silver">{body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
          <Button asChild variant="glass" className="mt-8">
            <Link to="/sustainability">
              Our commitments <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
