import { ArrowRight } from 'lucide-react';
import { Link } from '@/components/common/LangLink';
import { SectionHeading } from '@/components/common/SectionHeading';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/button';
import type { Post } from '@/lib/types';
import { NewsCard } from './NewsCard';

export function NewsGrid({ posts }: { posts: Post[] }) {
  return (
    <section id="news" aria-labelledby="news-title" className="section grain">
      <div className="container-site">
        <SectionHeading
          id="news-title"
          eyebrow="Latest news"
          title="Insights from the field."
          highlight={[2, 3]}
          intro="Exploration, aggregates and safety — explained in plain language."
        >
          <Button asChild variant="outline" className="w-fit">
            <Link to="/news">
              All news <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </SectionHeading>
        <RevealGroup as="ul" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((p) => (
            <RevealItem as="li" key={p.slug}>
              <NewsCard post={p} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
