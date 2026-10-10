import { Fragment, type ReactNode } from 'react';
import { Link } from '@/components/common/LangLink';
import { Parallax } from '@/components/motion/Parallax';
import { enterUp } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { SplitText } from '@/components/motion/SplitText';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { Crumb } from '@/lib/seo';
import type { ImageSource } from '@/lib/types';
import { Img } from './Img';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  highlight?: number[];
  intro?: ReactNode;
  image: ImageSource;
  crumbs: Crumb[];
  children?: ReactNode;
}

/**
 * Inner-page hero: photo with parallax + bottom gradient overlay (same in both themes
 * so white text stays ≥ 4.5:1), breadcrumbs, the page's single H1.
 */
export function PageHero({
  eyebrow,
  title,
  highlight,
  intro,
  image,
  crumbs,
  children,
}: PageHeroProps) {
  return (
    <section
      aria-labelledby="page-title"
      className="dark relative isolate flex min-h-[62vh] items-end overflow-hidden bg-graphite pb-14 pt-36 text-offwhite sm:min-h-[68vh] sm:pb-20"
    >
      <Parallax className="-z-20">
        <Img image={image} priority sizes="100vw" />
      </Parallax>
      <div className="photo-overlay absolute inset-0 -z-10" />
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-black/50 to-transparent" />

      <div className="container-site">
        <Breadcrumb className="mb-6">
          <BreadcrumbList className="text-silver">
            {crumbs.map((c, i) => (
              <Fragment key={c.path}>
                <BreadcrumbItem>
                  {i < crumbs.length - 1 ? (
                    <BreadcrumbLink asChild className="text-silver hover:text-copper-light">
                      <Link to={c.path}>{c.name}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="text-offwhite">{c.name}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {i < crumbs.length - 1 && <BreadcrumbSeparator className="text-silver/70" />}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <p className={cn('eyebrow mb-4 !text-copper-light', enterUp)}>{eyebrow}</p>
        <SplitText
          as="h1"
          id="page-title"
          text={title}
          highlight={highlight}
          immediate
          delay={0.15}
          className="max-w-4xl !text-[clamp(2.5rem,5.5vw,4.75rem)]"
        />
        {intro && (
          <p
            className={cn('mt-6 max-w-2xl text-lg text-silver sm:text-xl', enterUp)}
            style={{ animationDelay: '0.3s' }}
          >
            {intro}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
