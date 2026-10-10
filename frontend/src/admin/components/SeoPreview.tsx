import { SITE_URL } from '@/lib/seo';

const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

/**
 * Rough Google result snippet: search engines cut titles near 60 characters and descriptions
 * near 160, so the preview clips at those lengths.
 */
export function SeoPreview({
  title,
  description,
  url = SITE_URL.replace(/^https?:\/\//, ''),
}: {
  title: string;
  description: string;
  url?: string;
}) {
  return (
    <figure
      className="space-y-1 rounded-lg border bg-background p-4"
      aria-label="Search result preview"
    >
      <figcaption className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Search result preview
      </figcaption>
      <p className="truncate text-xs text-muted-foreground">{url}</p>
      <p className="text-lg leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">
        {clip(title || 'Page title', 60)}
      </p>
      <p className="text-sm text-muted-foreground">
        {clip(description || 'Add a description to show here.', 160)}
      </p>
    </figure>
  );
}
