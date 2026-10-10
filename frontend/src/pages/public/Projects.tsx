import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHero } from '@/components/common/PageHero';
import { CtaBand } from '@/components/sections/CtaBand';
import { ProjectCard } from '@/components/sections/ProjectCard';
import { Seo } from '@/components/seo/Seo';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { images } from '@/content/images';
import { mineralLabels, statusLabels } from '@/content/projects';
import { useProjects } from '@/features/projects/useProjects';
import { ease } from '@/lib/motion';
import type { Mineral, ProjectStatus } from '@/lib/types';

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'Projects', path: '/projects' },
];

const tabCls =
  'min-h-11 rounded-full px-4 data-[state=active]:bg-copper-gradient data-[state=active]:text-graphite data-[state=active]:shadow-copper-glow';

/** Primary keyword: "metal minerals Lalitpur". Filters live in the URL (?mineral=&status=). */
export default function Projects() {
  const { data: projects } = useProjects();
  const [params, setParams] = useSearchParams();
  const mineral = (params.get('mineral') ?? 'all') as Mineral | 'all';
  const status = (params.get('status') ?? 'all') as ProjectStatus | 'all';

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          (mineral === 'all' || p.mineral === mineral) && (status === 'all' || p.status === status),
      ),
    [projects, mineral, status],
  );

  function setFilter(key: 'mineral' | 'status', value: string) {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true, preventScrollReset: true });
  }

  return (
    <>
      <Seo
        title="Projects: Iron Ore & Metal Minerals"
        description="Explore Niraum Metals projects — iron ore, metal minerals in Lalitpur and across Nepal, and stone aggregate quarries — by mineral and stage."
        crumbs={crumbs}
      />
      <PageHero
        eyebrow="Projects"
        title="Iron ore and metal minerals, from Lalitpur outward."
        highlight={[3, 4]}
        intro="Our metal minerals work in Lalitpur and across Nepal, from first samples to steady supply. Filter by mineral or stage."
        image={images.channelMarksWide}
        crumbs={crumbs}
      />

      <section id="project-list" aria-labelledby="project-list-title" className="section grain">
        <div className="container-site">
          <h2 id="project-list-title" className="sr-only">
            Project list
          </h2>
          <div className="glass mb-10 flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <Tabs value={mineral} onValueChange={(v) => setFilter('mineral', v)}>
              <p id="filter-mineral" className="label mb-2 px-1 text-muted-foreground">
                Mineral
              </p>
              <TabsList
                aria-labelledby="filter-mineral"
                className="h-auto flex-wrap justify-start gap-1 rounded-full bg-transparent p-0"
              >
                <TabsTrigger value="all" className={tabCls}>
                  All
                </TabsTrigger>
                {Object.entries(mineralLabels).map(([k, v]) => (
                  <TabsTrigger key={k} value={k} className={tabCls}>
                    {v}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Tabs value={status} onValueChange={(v) => setFilter('status', v)}>
              <p id="filter-status" className="label mb-2 px-1 text-muted-foreground">
                Status
              </p>
              <TabsList
                aria-labelledby="filter-status"
                className="h-auto flex-wrap justify-start gap-1 rounded-full bg-transparent p-0"
              >
                <TabsTrigger value="all" className={tabCls}>
                  All
                </TabsTrigger>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <TabsTrigger key={k} value={k} className={tabCls}>
                    {v}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <p className="mb-6 text-sm text-muted-foreground" aria-live="polite">
            Showing {filtered.length} of {projects.length} projects
          </p>

          <motion.ul layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((p) => (
                <motion.li
                  key={p.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1, transition: { duration: 0.4, ease } }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                >
                  <ProjectCard project={p} className="aspect-[4/5]" />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
          {filtered.length === 0 && (
            <p className="glass p-8 text-center text-muted-foreground">
              No projects match these filters yet.
            </p>
          )}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
