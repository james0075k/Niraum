import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/components/common/LangLink';
import { Img } from '@/components/common/Img';
import { TiltCard } from '@/components/motion/TiltCard';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import type { Post } from '@/lib/types';

export function NewsCard({
  post,
  headingLevel = 'h3',
}: {
  post: Post;
  headingLevel?: 'h2' | 'h3';
}) {
  const Heading = headingLevel;
  return (
    <TiltCard className="glass h-full overflow-hidden">
      <article className="group relative flex h-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden rounded-t-[20px]">
          <Img
            image={post.coverImage}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="transition-transform duration-700 ease-brand group-hover:scale-105"
          />
          {post.isSample && (
            <Badge className="absolute left-4 top-4 border-copper-light/50 bg-black/50 text-copper-light backdrop-blur-md">
              Sample article
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col p-6">
          <p className="label text-muted-foreground">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            {post.tags[0] && <span className="text-copper-ink"> · {post.tags[0]}</span>}
          </p>
          <Heading className="mt-3 !text-xl font-semibold leading-snug">
            <Link
              to={`/news/${post.slug}`}
              className="text-foreground after:absolute after:inset-0 after:content-['']"
            >
              {post.title}
            </Link>
          </Heading>
          <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-copper-ink">
            Read article
            <ArrowUpRight
              className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </article>
    </TiltCard>
  );
}
