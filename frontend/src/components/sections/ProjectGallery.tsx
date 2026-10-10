import { ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from '@/components/common/LangLink';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Button } from '@/components/ui/button';
import type { Project } from '@/lib/types';
import { ProjectCard } from './ProjectCard';

/**
 * Featured projects. Desktop (≥ 1024px, motion allowed): the section pins and vertical
 * scroll drives the track sideways (GSAP ScrollTrigger, loaded lazily). Otherwise it
 * is a native horizontal scroller with snap points.
 */
export function ProjectGallery({ projects }: { projects: Project[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let revert = () => {};
    let cancelled = false;
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled || !sectionRef.current || !trackRef.current) return;
        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();
        mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
          const track = trackRef.current!;
          const distance = () => Math.max(0, track.scrollWidth - track.clientWidth);
          gsap.to(track, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top top',
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          });
        });
        revert = () => mm.revert();
      },
    );
    return () => {
      cancelled = true;
      revert();
    };
  }, [projects.length]);

  return (
    <section
      ref={sectionRef}
      id="featured-projects"
      aria-labelledby="featured-projects-title"
      className="dark relative overflow-hidden bg-graphite py-20 text-offwhite sm:py-24 lg:flex lg:min-h-screen lg:flex-col lg:justify-center"
    >
      <div className="copper-haze absolute inset-0" aria-hidden="true" />
      <div className="container-site relative">
        <SectionHeading
          id="featured-projects-title"
          eyebrow="Featured projects"
          title="Where the work happens."
          highlight={[3]}
          intro={
            <span className="text-silver">
              Exploration, development and supply across Nepal. Sample projects are shown until site
              details are confirmed.
            </span>
          }
          className="!mb-10"
        >
          <Button asChild variant="glass" className="w-fit">
            <Link to="/projects">
              All projects <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </SectionHeading>
      </div>

      <ul
        ref={trackRef}
        className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] sm:gap-6 sm:px-6 lg:snap-none lg:overflow-visible lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))]"
        aria-label="Featured projects"
      >
        {projects.map((p) => (
          <li
            key={p.slug}
            className="w-[82vw] shrink-0 snap-start sm:w-[58vw] lg:w-[38vw] xl:w-[34rem]"
          >
            <ProjectCard project={p} className="aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/3.6]" />
          </li>
        ))}
      </ul>
    </section>
  );
}
