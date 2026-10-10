import { MapPinOff } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Img } from '@/components/common/Img';
import { PageHero } from '@/components/common/PageHero';
import { SectionHeading } from '@/components/common/SectionHeading';
import { TbcText } from '@/components/common/Tbc';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { CtaBand } from '@/components/sections/CtaBand';
import { MapCard } from '@/components/sections/MapCard';
import { ProjectCard } from '@/components/sections/ProjectCard';
import { Seo } from '@/components/seo/Seo';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { mineralLabels, statusLabels } from '@/content/projects';
import { useProject, useProjects } from '@/features/projects/useProjects';
import NotFound from './NotFound';

export default function ProjectDetail() {
  const { slug = '' } = useParams();
  const { data: project, isLoading } = useProject(slug);
  const { data: all } = useProjects();
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="container-site space-y-6 pb-24 pt-40">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (!project) return <NotFound />;

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Projects', path: '/projects' },
    { name: project.title, path: `/projects/${project.slug}` },
  ];
  const related = all
    .filter((p) => p.slug !== project.slug)
    .sort((a, b) => Number(b.mineral === project.mineral) - Number(a.mineral === project.mineral))
    .slice(0, 3);
  const { lat, lng } = project.location;

  return (
    <>
      <Seo
        title={project.title}
        description={project.summary.slice(0, 155)}
        image={project.coverImage.src}
        crumbs={crumbs}
      />
      <PageHero
        eyebrow={`${mineralLabels[project.mineral]} · ${statusLabels[project.status]}`}
        title={project.title}
        intro={project.summary}
        image={project.coverImage}
        crumbs={crumbs}
      >
        {project.isSample && (
          <Badge className="mt-6 border-copper-light/50 bg-black/40 text-copper-light">
            Sample project — details to be confirmed
          </Badge>
        )}
      </PageHero>

      <section id="overview" aria-labelledby="overview-title" className="section grain">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionHeading
              id="overview-title"
              eyebrow="Overview"
              title="About this project"
              className="!mb-8"
            />
            <Reveal className="prose-site">
              <div dangerouslySetInnerHTML={{ __html: project.body }} />
            </Reveal>
          </div>
          <Reveal className="lg:col-span-5">
            <div className="glass overflow-hidden">
              <h3 className="label border-b border-foreground/10 px-6 py-4 text-foreground">
                Key facts
              </h3>
              <Table>
                <TableBody>
                  {project.facts.map((f) => (
                    <TableRow key={f.label} className="hover:bg-transparent">
                      <TableHead
                        scope="row"
                        className="h-auto w-2/5 px-6 py-3 align-top font-medium"
                      >
                        {f.label}
                      </TableHead>
                      <TableCell className="px-6 py-3 text-foreground">
                        <TbcText text={f.value} />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="row" className="h-auto px-6 py-3 align-top font-medium">
                      Location
                    </TableHead>
                    <TableCell className="px-6 py-3 text-foreground">
                      <TbcText text={`${project.location.name}, ${project.location.district}`} />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="gallery" aria-labelledby="gallery-title" className="section bg-muted/40">
        <div className="container-site">
          <SectionHeading
            id="gallery-title"
            eyebrow="Gallery"
            title="On the ground"
            className="!mb-8"
          />
          <RevealGroup as="ul" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {project.gallery.map((g, i) => (
              <RevealItem as="li" key={i}>
                <button
                  type="button"
                  onClick={() => setLightbox(i)}
                  className="group block aspect-square w-full overflow-hidden rounded-2xl"
                  aria-label={`Open photo ${i + 1} of ${project.gallery.length}: ${g.alt}`}
                >
                  <Img
                    image={g}
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="transition-transform duration-700 ease-brand group-hover:scale-105"
                  />
                </button>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
        <Dialog open={lightbox !== null} onOpenChange={(o) => !o && setLightbox(null)}>
          <DialogContent className="max-w-5xl border-none bg-graphite p-3 text-offwhite sm:p-6">
            <DialogTitle className="sr-only">{project.title} — photos</DialogTitle>
            <DialogDescription className="sr-only">
              Use the arrow buttons or keys to browse photos.
            </DialogDescription>
            {lightbox !== null && (
              <Carousel opts={{ startIndex: lightbox, loop: true }} className="mx-auto w-full">
                <CarouselContent>
                  {project.gallery.map((g, i) => (
                    <CarouselItem key={i}>
                      <figure>
                        <div className="flex max-h-[75vh] items-center justify-center overflow-hidden rounded-xl">
                          <Img
                            image={g}
                            sizes="90vw"
                            className="!h-auto max-h-[75vh] !object-contain"
                          />
                        </div>
                        <figcaption className="mt-3 text-center text-sm text-silver">
                          {g.alt}
                        </figcaption>
                      </figure>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2 h-11 w-11 bg-black/50 text-offwhite sm:-left-4" />
                <CarouselNext className="right-2 h-11 w-11 bg-black/50 text-offwhite sm:-right-4" />
              </Carousel>
            )}
          </DialogContent>
        </Dialog>
      </section>

      <section id="location" aria-labelledby="location-title" className="section grain">
        <div className="container-site">
          <SectionHeading
            id="location-title"
            eyebrow="Location"
            title="Where it is"
            className="!mb-8"
          />
          {lat !== undefined && lng !== undefined ? (
            <MapCard
              lat={lat}
              lng={lng}
              zoom={12}
              title={project.title}
              address={`${project.location.name}, ${project.location.district}`}
            />
          ) : (
            <div className="glass flex flex-col items-center gap-3 p-10 text-center">
              <MapPinOff className="h-8 w-8 text-copper-ink" aria-hidden="true" />
              <p className="font-semibold">Site coordinates to be confirmed</p>
              <p className="max-w-md text-sm text-muted-foreground">
                The map appears here once the project location is published.
              </p>
            </div>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section id="related" aria-labelledby="related-title" className="section bg-muted/40">
          <div className="container-site">
            <SectionHeading
              id="related-title"
              eyebrow="More projects"
              title="Related projects"
              className="!mb-8"
            />
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.slug}>
                  <ProjectCard project={p} className="aspect-[4/5]" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}
