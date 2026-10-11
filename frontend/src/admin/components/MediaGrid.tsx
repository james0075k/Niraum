import { FileText, Film } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatBytes, mediaTitle, type MediaItem } from '../media/useMedia';

/** Image thumbnail, or a type icon for PDFs and videos. */
export function MediaThumb({ item, className }: { item: MediaItem; className?: string }) {
  if (item.type === 'image') {
    return (
      <img
        src={item.url}
        alt=""
        loading="lazy"
        className={cn('aspect-[4/3] w-full rounded-md bg-muted object-cover', className)}
      />
    );
  }
  const Icon = item.type === 'video' ? Film : FileText;
  return (
    <div
      className={cn(
        'flex aspect-[4/3] w-full items-center justify-center rounded-md bg-muted',
        className,
      )}
    >
      <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
    </div>
  );
}

/**
 * Grid of media. With `onSelect` each tile is a toggle button (picker); otherwise `actions`
 * renders per-tile controls (library page).
 */
export function MediaGrid({
  items,
  loading,
  selectedId,
  onSelect,
  actions,
}: {
  items: MediaItem[];
  loading?: boolean;
  selectedId?: string | null;
  onSelect?(item: MediaItem): void;
  actions?(item: MediaItem): ReactNode;
}) {
  if (loading) {
    return (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i}>
            <Skeleton className="aspect-[4/3] w-full" />
          </li>
        ))}
      </ul>
    );
  }
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No files yet.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const caption = (
          <span className="block min-w-0 space-y-0.5 text-left">
            <span className="block truncate text-sm">{mediaTitle(item)}</span>
            <span className="block text-xs text-muted-foreground">
              {item.type === 'image' && item.width ? `${item.width}×${item.height} · ` : ''}
              {formatBytes(item.size)}
            </span>
          </span>
        );
        return (
          <li key={item.id} className="min-w-0">
            {onSelect ? (
              <Button
                type="button"
                variant="ghost"
                aria-pressed={selectedId === item.id}
                onClick={() => onSelect(item)}
                className={cn(
                  'h-auto w-full flex-col items-stretch gap-2 whitespace-normal rounded-lg border p-2',
                  selectedId === item.id && 'border-copper ring-2 ring-copper',
                )}
              >
                <MediaThumb item={item} />
                {caption}
              </Button>
            ) : (
              <div className="space-y-2 rounded-lg border p-2">
                <MediaThumb item={item} />
                {caption}
                {actions?.(item)}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
