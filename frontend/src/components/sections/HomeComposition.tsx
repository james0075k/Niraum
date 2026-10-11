import { ArrowRight } from 'lucide-react';
import { Link } from '@/components/common/LangLink';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { CompositionDonut } from '@/components/sections/CompositionDonut';
import { DataOriginNote } from '@/components/sections/DataOriginNote';
import { Button } from '@/components/ui/button';
import type { AssaySection } from '@/lib/types';
import { useT } from '@/hooks/useLang';

/** Home → ore composition donut (Table 14 deposit average), linking to Technical Data. */
export function HomeComposition({ overall }: { overall: AssaySection | null }) {
  const { t } = useT('home');
  if (!overall) return null;
  return (
    <section id="composition" aria-labelledby="composition-heading" className="section bg-muted/40">
      <div className="container-site grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading
            id="composition-heading"
            eyebrow={t('composition.eyebrow')}
            title={t('composition.title')}
            intro={t('composition.body', { m: overall.thicknessM })}
          />
          <Button asChild variant="outline" size="lg">
            <Link to="/technical-data">
              {t('composition.link')} <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <Reveal className="min-w-0 lg:col-span-7">
          <CompositionDonut overall={overall} />
          <DataOriginNote />
        </Reveal>
      </div>
    </section>
  );
}
