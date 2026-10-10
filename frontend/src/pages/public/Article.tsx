import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { PageHero } from '@/components/common/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { NewsCard } from '@/components/sections/NewsCard';
import { Seo } from '@/components/seo/Seo';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePost, usePosts } from '@/features/news/usePosts';
import { formatDate } from '@/lib/format';
import { articleLd } from '@/lib/seo';
import NotFound from './NotFound';

export default function Article() {
  const { slug = '' } = useParams();
  const { data: post, isLoading } = usePost(slug);
  const { data: posts } = usePosts();

  if (isLoading) {
    return (
      <div className="container-site space-y-6 pb-24 pt-40">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (!post) return <NotFound />;

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'News', path: '/news' },
    { name: post.title, path: `/news/${post.slug}` },
  ];
  const more = posts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <Seo
        title={post.title.length > 34 ? `${post.title.slice(0, 33).trimEnd()}…` : post.title}
        description={post.excerpt.slice(0, 155)}
        image={post.coverImage.src}
        type="article"
        crumbs={crumbs}
        jsonLd={[articleLd(post)]}
      />
      <PageHero
        eyebrow={post.tags.join(' · ') || 'News'}
        title={post.title}
        image={post.coverImage}
        crumbs={crumbs}
      >
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-silver">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.author}</span>
          {post.isSample && (
            <Badge className="border-copper-light/50 bg-black/40 text-copper-light">
              Sample article
            </Badge>
          )}
        </div>
      </PageHero>

      <article aria-labelledby="page-title" className="section grain">
        <div className="container-site">
          <Reveal className="prose-site mx-auto">
            <p className="text-xl text-foreground">{post.excerpt}</p>
            <div dangerouslySetInnerHTML={{ __html: post.body }} className="space-y-5" />
          </Reveal>
          <div className="mx-auto mt-12 max-w-3xl">
            <Link
              to="/news"
              className="inline-flex min-h-11 items-center gap-2 font-semibold text-copper-ink"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All news
            </Link>
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section id="more-news" aria-labelledby="more-news-title" className="section bg-muted/40">
          <div className="container-site">
            <h2 id="more-news-title" className="mb-10">
              More from the field
            </h2>
            <ul className="grid gap-5 sm:grid-cols-2">
              {more.map((p) => (
                <li key={p.slug}>
                  <NewsCard post={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
