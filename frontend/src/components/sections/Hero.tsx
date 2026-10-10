import { ArrowRight } from 'lucide-react';
import { Link } from '@/components/common/LangLink';
import { Img } from '@/components/common/Img';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { Parallax } from '@/components/motion/Parallax';
import { SplitText } from '@/components/motion/SplitText';
import { Button } from '@/components/ui/button';
import { photos } from '@/content/siteImages';
import { HERO_VIDEO_URL } from '@/content/placeholders';
import { useSettings } from '@/features/settings/useSettings';
import { useLang, useT } from '@/hooks/useLang';
import { enterUp } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Full-screen hero. Looping video when one is supplied (HERO_VIDEO_URL), otherwise
 * the poster photograph with parallax. Overlay is identical in both themes so the
 * white H1 stays readable (≥ 7:1 on the darkened lower area).
 *
 * Poster: Niraum's own 3024 px field photo (sharp enough for large screens — no blur/scale
 * tricks). The dark gradients keep text readable in light and dark mode.
 */
export function Hero() {
  const { motto } = useSettings();
  const lang = useLang();
  const { t } = useT(['home', 'common']);
  const poster = photos.cliffGeologist;
  // The admin's motto is English-first; Nepali uses the reviewed tagline from the locale file.
  const title = lang === 'ne' ? t('hero.tagline') : motto;

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
          className={HERO_VIDEO_URL ? 'hidden motion-reduce:block' : undefined}
        />
      </Parallax>
      {/* Bottom 70% gradient + side vignette — same in light and dark. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/45 to-black/10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
      <div className="copper-haze absolute inset-0 -z-10 opacity-70" />

      <div className="container-site">
        <p
          className={cn('eyebrow mb-6 !text-copper-light', enterUp)}
          style={{ animationDelay: '0.1s' }}
        >
          {t('hero.eyebrow')}
        </p>
        <SplitText
          as="h1"
          id="hero-title"
          text={title}
          highlight={lang === 'ne' ? [1] : [2, 3]}
          immediate
          delay={0.2}
          className="max-w-5xl !text-[clamp(2.5rem,7vw,5.5rem)]"
        />
        <p
          className={cn('mt-6 max-w-xl text-lg text-silver sm:text-xl', enterUp)}
          style={{ animationDelay: '0.55s' }}
        >
          {t('hero.sub')}
        </p>
        <div
          className={cn('mt-10 flex flex-wrap gap-3', enterUp)}
          style={{ animationDelay: '0.7s' }}
        >
          <MagneticButton>
            <Button asChild size="lg">
              <Link to="/contact?topic=supply#inquiry">
                {t('common:cta.bulkSupply')} <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </MagneticButton>
          <MagneticButton>
            <Button asChild size="lg" variant="glass">
              <Link to="/technical-data">{t('common:cta.viewTechnical')}</Link>
            </Button>
          </MagneticButton>
        </div>
      </div>

      <a
        href="#stats"
        className="absolute bottom-28 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-silver transition-colors hover:text-offwhite sm:flex"
        aria-label={t('hero.scroll')}
      >
        <span className="label !text-[0.65rem]">Scroll</span>
        <span className="flex h-10 w-6 justify-center rounded-full border border-silver/50 pt-2">
          <span className="h-2 w-0.5 animate-scroll-cue rounded-full bg-copper-light" />
        </span>
      </a>
    </section>
  );
}
