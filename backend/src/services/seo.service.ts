import { jobService, postService, projectService } from './resources.js';

export const seoService = {
  /** Public slugs + last-modified dates — the frontend build turns this into sitemap.xml. */
  async sitemapData() {
    const [projects, posts, jobs] = await Promise.all([
      projectService.sitemapEntries(),
      postService.sitemapEntries(),
      jobService.sitemapEntries(),
    ]);
    return { projects, posts, jobs, generatedAt: new Date().toISOString() };
  },
};
