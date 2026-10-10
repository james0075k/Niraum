import { ArrowRight } from 'lucide-react';
import { Link } from '@/components/common/LangLink';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { Reveal } from '@/components/motion/Reveal';
import { SplitText } from '@/components/motion/SplitText';
import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/useLang';

/** Big closing call to action (primary button defaults to the quote request). */
export function CtaBand({
  title = 'Building something that needs strong foundations?',
  body = 'Tell us what you need — iron ore, metal minerals or construction aggregates — and we will reply with availability, specification and a delivery plan.',
  primaryTo = '/contact?subject=Quote%20request',
  primaryLabel,
}: {
  title?: string;
  body?: string;
  primaryTo?: string;
  primaryLabel?: string;
}) {
  const { t } = useT();
  return (
    <section id="contact-cta" aria-labelledby="contact-cta-title" className="section">
      <div className="container-site">
        <div className="texture-brushed dark relative isolate overflow-hidden rounded-[28px] bg-graphite px-6 py-16 text-offwhite sm:px-12 sm:py-20 lg:px-20">
          <div className="copper-haze absolute inset-0 -z-10" aria-hidden="true" />
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-copper/30 blur-3xl"
          />
          <p className="eyebrow mb-5">{t('cta.contactUs')}</p>
          <SplitText
            as="h2"
            id="contact-cta-title"
            text={title}
            highlight={[4, 5]}
            className="max-w-3xl"
          />
          <Reveal as="p" delay={0.1} className="mt-6 max-w-2xl text-lg text-silver">
            {body}
          </Reveal>
          <Reveal delay={0.2} className="mt-10 flex flex-wrap gap-3">
            <MagneticButton>
              <Button asChild size="lg">
                <Link to={primaryTo}>
                  {primaryLabel ?? t('cta.quote')} <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </MagneticButton>
            <Button asChild size="lg" variant="glass">
              <Link to="/contact">{t('cta.contactUs')}</Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
