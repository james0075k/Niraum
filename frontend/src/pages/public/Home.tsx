import { CtaBand } from '@/components/sections/CtaBand';
import { Hero } from '@/components/sections/Hero';
import { LogoMarquee } from '@/components/sections/LogoMarquee';
import { NewsGrid } from '@/components/sections/NewsGrid';
import { ProcessTimeline } from '@/components/sections/ProcessTimeline';
import { ProjectGallery } from '@/components/sections/ProjectGallery';
import { Services } from '@/components/sections/Services';
import { Stats } from '@/components/sections/Stats';
import { SustainabilityBand } from '@/components/sections/SustainabilityBand';
import { Seo } from '@/components/seo/Seo';
import { homeStats, processSteps, sectors } from '@/content/site';
import { usePosts } from '@/features/news/usePosts';
import { useProjects } from '@/features/projects/useProjects';
import { useServices } from '@/features/services/useServices';

/** Primary keyword: "mining company in Nepal". */
export default function Home() {
  const { data: services } = useServices();
  const { data: projects } = useProjects();
  const { data: posts } = usePosts();
  const featured = projects.filter((p) => p.featured);

  return (
    <>
      <Seo path="/" />
      <Hero />
      <Stats stats={homeStats} />
      <Services services={services} />
      <ProjectGallery projects={featured.length ? featured : projects} />
      <ProcessTimeline steps={processSteps} />
      <SustainabilityBand />
      <NewsGrid posts={posts} />
      <LogoMarquee items={sectors} />
      <CtaBand />
    </>
  );
}
