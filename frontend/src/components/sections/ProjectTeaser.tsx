import { ArrowRight } from 'lucide-react';
import { Img } from '@/components/common/Img';
import { Link } from '@/components/common/LangLink';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/button';
import { siteImages } from '@/content/siteImages';
import { useT } from '@/hooks/useLang';

/** Home → Katujpani teaser with the lease map (areas A, B, C). */
export function ProjectTeaser() {
  const { t } = useT('home');
  return (
    <section
      id="project"
      aria-labelledby="project-title"
      className="texture-hematite section dark bg-graphite text-offwhite"
    >
      <div className="container-site grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading
            id="project-title"
            eyebrow={t('project.eyebrow')}
            title={t('project.title')}
            intro={t('project.body')}
          />
          <Button asChild size="lg" className="mt-2">
            <Link to="/our-project">
              {t('project.cta')} <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <Reveal className="overflow-hidden rounded-[20px] bg-offwhite p-2 shadow-glass">
          <Img
            image={siteImages.mapLease}
            className="!object-contain"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </Reveal>
      </div>
    </section>
  );
}
