import { AlertTriangle, Copy, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { MediaGrid } from '../components/MediaGrid';
import { MediaUpload } from '../components/MediaUpload';
import {
  isStorageMissing,
  mediaErrorMessage,
  mediaTitle,
  STORAGE_MISSING,
  useMediaList,
  useMediaMutations,
  type MediaItem,
  type MediaType,
} from '../media/useMedia';

const TABS: { value: 'all' | MediaType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'document', label: 'Documents' },
  { value: 'video', label: 'Videos' },
];

/** Media library: type filter, upload, edit alt text, delete (Cloudinary first, then record). */
export function MediaLibrary() {
  const [tab, setTab] = useState<'all' | MediaType>('all');
  const [page, setPage] = useState(1);
  const [storageMissing, setStorageMissing] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [alt, setAlt] = useState('');
  const [deleting, setDeleting] = useState<MediaItem | null>(null);
  const list = useMediaList({ page, type: tab === 'all' ? undefined : tab });
  const { updateAlt, remove } = useMediaMutations();
  const pages = list.data?.meta.pages ?? 1;

  const failed = (err: unknown) => {
    if (isStorageMissing(err)) setStorageMissing(true);
    toast.error(mediaErrorMessage(err));
  };

  const saveAlt = () => {
    if (!editing) return;
    const next = alt.trim();
    if (editing.type === 'image' && !next) return;
    updateAlt.mutate(
      { id: editing.id, alt: next },
      {
        onSuccess: () => {
          toast.success('Alt text saved');
          setEditing(null);
        },
        onError: failed,
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    remove.mutate(
      { id: target.id },
      { onSuccess: () => toast.success('File deleted'), onError: failed },
    );
  };

  const copyUrl = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      toast.success('URL copied');
    } catch {
      toast.error("Couldn't copy the URL");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Media</h1>
        <p className="text-sm text-muted-foreground">
          Images, PDFs and videos stored in Cloudinary. Removing a file here doesn't update pages
          that still use its URL.
        </p>
      </div>

      {storageMissing && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-medium">{STORAGE_MISSING}</p>
            <p className="text-muted-foreground">
              Set the CLOUDINARY_* variables in the backend environment to upload or delete files.
            </p>
          </div>
        </div>
      )}

      <MediaUpload
        onUploaded={() => toast.success('File uploaded')}
        onStorageMissing={() => setStorageMissing(true)}
      />

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as typeof tab);
          setPage(1);
        }}
      >
        <TabsList aria-label="File type">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {list.isError ? (
        <div role="alert" className="space-y-3 rounded-xl border p-6">
          <p className="text-sm">{mediaErrorMessage(list.error)}</p>
          <Button variant="outline" size="sm" onClick={() => void list.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <MediaGrid
          items={list.data?.data ?? []}
          loading={list.isLoading}
          actions={(item) => (
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Edit alt text of ${mediaTitle(item)}`}
                onClick={() => {
                  setEditing(item);
                  setAlt(item.alt);
                }}
              >
                <Pencil aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Copy URL of ${mediaTitle(item)}`}
                onClick={() => void copyUrl(item)}
              >
                <Copy aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                aria-label={`Delete ${mediaTitle(item)}`}
                onClick={() => setDeleting(item)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          )}
        />
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <Button
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
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {editing && (
        <Dialog open onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit alt text</DialogTitle>
            </DialogHeader>
            <form
              id="alt-form"
              onSubmit={(e) => {
                e.preventDefault();
                saveAlt();
              }}
              className="space-y-2"
            >
              <label htmlFor="media-alt" className="text-sm font-medium">
                Alt text
              </label>
              <Input
                id="media-alt"
                value={alt}
                maxLength={200}
                onChange={(e) => setAlt(e.target.value)}
              />
              {editing.type === 'image' && !alt.trim() && (
                <p className="text-xs font-medium text-destructive">Images need alt text.</p>
              )}
            </form>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="alt-form"
                disabled={updateAlt.isPending || (editing.type === 'image' && !alt.trim())}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this file?"
        description={
          deleting
            ? `"${mediaTitle(deleting)}" is removed from Cloudinary and the library. Pages that use its URL will show a broken image.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

export default MediaLibrary;
