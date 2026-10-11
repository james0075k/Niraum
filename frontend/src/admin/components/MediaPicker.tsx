import { ImageIcon, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  toPicked,
  useMediaList,
  type MediaItem,
  type MediaType,
  type PickedMedia,
} from '../media/useMedia';
import { MediaGrid } from './MediaGrid';
import { MediaUpload } from './MediaUpload';

const NOUN: Record<MediaType, string> = { image: 'image', document: 'document', video: 'video' };

/**
 * Current file + "Choose from library" dialog over /admin/media (with upload). A file uploaded
 * from the dialog is chosen straight away.
 */
export function MediaPicker({
  value,
  onChange,
  type = 'image',
}: {
  value: { url: string; alt: string } | null;
  onChange(v: PickedMedia | null): void;
  type?: MediaType;
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const list = useMediaList({ page, type });
  const noun = NOUN[type];
  const pages = list.data?.meta.pages ?? 1;

  const choose = (item: MediaItem) => {
    onChange(toPicked(item));
    setOpen(false);
    setSelected(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {value?.url ? (
        type === 'image' ? (
          <img
            src={value.url}
            alt={value.alt}
            className="h-20 w-28 rounded-md border object-cover"
          />
        ) : (
          <a href={value.url} target="_blank" rel="noreferrer" className="text-sm underline">
            {value.alt || value.url.split('/').pop()}
          </a>
        )
      ) : (
        <div className="flex h-20 w-28 items-center justify-center rounded-md border border-dashed text-muted-foreground">
          <ImageIcon className="h-6 w-6" aria-hidden="true" />
          <span className="sr-only">No {noun}</span>
        </div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Choose from library
        </Button>
        {value?.url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Remove ${noun}`}
            onClick={() => onChange(null)}
          >
            <X aria-hidden="true" />
            Remove
          </Button>
        )}
      </div>

      {open && (
        <Dialog open onOpenChange={(o) => !o && setOpen(false)}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Choose {noun === 'image' ? 'an image' : `a ${noun}`}</DialogTitle>
              <DialogDescription>
                Pick a file from the library or upload a new one.
              </DialogDescription>
            </DialogHeader>
            <MediaGrid
              items={list.data?.data ?? []}
              loading={list.isLoading}
              selectedId={selected?.id}
              onSelect={setSelected}
            />
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="tabular-nums">
                  Page {page} of {pages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
            <details className="rounded-lg">
              <summary className="cursor-pointer text-sm font-medium">Upload a new {noun}</summary>
              <div className="pt-3">
                <MediaUpload only={type} onUploaded={choose} />
              </div>
            </details>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!selected}
                onClick={() => selected && choose(selected)}
              >
                Use {noun}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
