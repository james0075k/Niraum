import { PageHero } from '@/components/common/PageHero';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { NewsCard } from '@/components/sections/NewsCard';
import { Seo } from '@/components/seo/Seo';
import { Skeleton } from '@/components/ui/skeleton';
import { images } from '@/content/images';
import { usePosts } from '@/features/news/usePosts';

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'News', path: '/news' },
];

/** Primary keyword: "mining news Nepal". */
export default function News() {
  const { data: posts, isFetching } = usePosts();

  return (
    <>
      <Seo
        title="Mining News Nepal"
        description="Mining news from Nepal and Niraum Metals: exploration updates, construction aggregate know-how and safety on site."
        crumbs={crumbs}
      />
      <PageHero
        eyebrow="News & insights"
        title="Mining news from Nepal, explained."
        highlight={[0, 1]}
        intro="Mining news from Nepal and our own sites: project updates, technical explainers and safety notes."
        image={images.sampleCh8}
        crumbs={crumbs}
      />
      <section id="articles" aria-labelledby="articles-title" className="section grain">
        <div className="container-site">
          <h2 id="articles-title" className="sr-only">
            All articles
          </h2>
          {posts.length === 0 && isFetching ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-96 rounded-[20px]" />
              ))}
            </div>
          ) : (
            <RevealGroup as="ul" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <RevealItem as="li" key={p.slug}>
                  <NewsCard post={p} />
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
      </section>
    </>
  );
}
