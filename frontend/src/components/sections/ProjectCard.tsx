import { ArrowUpRight, MapPin } from 'lucide-react';
import { Link } from '@/components/common/LangLink';
import { Img } from '@/components/common/Img';
import { TbcText } from '@/components/common/Tbc';
import { Badge } from '@/components/ui/badge';
import { mineralLabels, statusLabels } from '@/content/projects';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Photo card. On hover-capable devices the location/mineral details reveal on hover
 * or keyboard focus; on touch screens they are always visible (no hover-only info).
 */
export function ProjectCard({
  project,
  className,
  headingLevel = 'h3',
}: {
  project: Project;
  className?: string;
  headingLevel?: 'h2' | 'h3';
}) {
  const Heading = headingLevel;
  const hoverHide =
    '[@media(hover:hover)]:translate-y-3 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:translate-y-0 [@media(hover:hover)]:group-focus-within:opacity-100';

  return (
    <article
      className={cn(
        'group relative isolate overflow-hidden rounded-[20px] bg-graphite text-offwhite shadow-glass',
        className,
      )}
    >
      <div className="absolute inset-0 -z-10">
        <Img
          image={project.coverImage}
          sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
          className="transition-transform duration-700 ease-brand group-focus-within:scale-105 group-hover:scale-105"
        />
      </div>
      <div className="photo-overlay absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 bg-black/0 transition-colors duration-500 group-hover:bg-black/20" />

      <div className="flex h-full flex-col justify-between p-6 sm:p-7">
        <div className="flex flex-wrap gap-2">
          <Badge className="border-white/20 bg-black/40 text-offwhite backdrop-blur-md">
            {statusLabels[project.status]}
          </Badge>
          {project.isSample && (
            <Badge className="border-copper-light/50 bg-black/40 text-copper-light backdrop-blur-md">
              Sample
            </Badge>
          )}
        </div>

        <div>
          <p className="label text-copper-light">{mineralLabels[project.mineral]}</p>
          <Heading className="mt-2 !text-2xl font-bold leading-tight">
            <Link
              to={`/projects/${project.slug}`}
              className="text-offwhite after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {project.title}
            </Link>
          </Heading>
          <div className={cn('mt-3 transition-all duration-500 ease-brand', hoverHide)}>
            <p className="flex items-center gap-2 text-sm text-silver">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                <TbcText text={project.location.name} />,{' '}
                <TbcText text={project.location.district} />
              </span>
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-silver">{project.summary}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-copper-light">
              View project <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
      {/* Visible focus ring for the stretched link. */}
      <span className="pointer-events-none absolute inset-0 rounded-[20px] ring-copper-light ring-offset-0 group-has-[:focus-visible]:ring-2" />
    </article>
  );
}
