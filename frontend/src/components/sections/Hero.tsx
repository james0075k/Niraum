import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Img } from '@/components/common/Img';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { Parallax } from '@/components/motion/Parallax';
import { Reveal } from '@/components/motion/Reveal';
import { SplitText } from '@/components/motion/SplitText';
import { Button } from '@/components/ui/button';
import { siteImages } from '@/content/siteImages';
import { HERO_VIDEO_URL } from '@/content/placeholders';
import { useSettings } from '@/features/settings/useSettings';
import { cn } from '@/lib/utils';

/**
 * Full-screen hero. Looping video when one is supplied (HERO_VIDEO_URL), otherwise
 * the poster photograph with parallax. Overlay is identical in both themes so the
 * white H1 stays readable (≥ 7:1 on the darkened lower area).
 *
 * The Katujpani hero photo is only ~1100 px wide: on ≥ 1600 px screens a 2 px blur (with a
 * slight scale so the blurred edge stays off-screen) hides the upscaling.
 */
export function Hero() {
  const { motto } = useSettings();
  const poster = siteImages.heroSlope;

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="dark relative isolate flex min-h-[100svh] items-end overflow-hidden bg-graphite pb-28 pt-32 text-offwhite sm:items-center sm:pb-24"
    >
      <Parallax className="-z-20" offset={22}>
        {HERO_VIDEO_URL ? (
          <video
            className="h-full w-full object-cover motion-reduce:hidden"
            src={HERO_VIDEO_URL}
            poster={poster.src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        ) : null}
        <Img
          image={poster}
          priority
          sizes="100vw"
          className={cn(
            'min-[1600px]:scale-[1.03] min-[1600px]:blur-[2px]',
            HERO_VIDEO_URL && 'hidden motion-reduce:block',
          )}
        />
      </Parallax>
      {/* Bottom 70% gradient + side vignette — same in light and dark. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/45 to-black/10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
      <div className="copper-haze absolute inset-0 -z-10 opacity-70" />

      <div className="container-site">
        <Reveal as="p" className="eyebrow mb-6 !text-copper-light" delay={0.1}>
          Lalitpur, Nepal · Mining &amp; Metals
        </Reveal>
        <SplitText
          as="h1"
          id="hero-title"
          text={motto}
          highlight={[2, 3]}
          immediate
          delay={0.2}
          className="max-w-5xl !text-[clamp(2.5rem,7vw,5.5rem)]"
        />
        <Reveal as="p" delay={0.55} className="mt-6 max-w-xl text-lg text-silver sm:text-xl">
          A mining company in Nepal supplying iron ore, metal minerals and stone aggregates to the
          people who build South Asia.
        </Reveal>
        <Reveal delay={0.7} className="mt-10 flex flex-wrap gap-3">
          <MagneticButton>
            <Button asChild size="lg">
              <Link to="/operations">
                Explore Operations <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </MagneticButton>
          <MagneticButton>
            <Button asChild size="lg" variant="glass">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </MagneticButton>
        </Reveal>
      </div>

      <a
        href="#stats"
        className="absolute bottom-28 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-silver transition-colors hover:text-offwhite sm:flex"
        aria-label="Scroll to company figures"
      >
        <span className="label !text-[0.65rem]">Scroll</span>
        <span className="flex h-10 w-6 justify-center rounded-full border border-silver/50 pt-2">
          <span className="h-2 w-0.5 animate-scroll-cue rounded-full bg-copper-light" />
        </span>
      </a>
    </section>
  );
}
