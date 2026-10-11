import { UploadCloud } from 'lucide-react';
import { useId, useRef, useState, type DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  acceptFor,
  fileProblem,
  formatBytes,
  isStorageMissing,
  mediaErrorMessage,
  STORAGE_MISSING,
  typeOfMime,
  useMediaMutations,
  type MediaItem,
  type MediaType,
} from '../media/useMedia';

/**
 * Drop zone + alt text + Upload. Images need alt text before Upload enables (the API rejects
 * them without it); size and type are checked here first so a 50 MB mistake never leaves the
 * browser. `onStorageMissing` lets the page show its banner.
 */
export function MediaUpload({
  only,
  onUploaded,
  onStorageMissing,
}: {
  only?: MediaType;
  onUploaded?(item: MediaItem): void;
  onStorageMissing?(): void;
}) {
  const fileId = useId();
  const altId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');
  const { upload } = useMediaMutations();

  const problem = file ? fileProblem(file, only) : null;
  const isImage = file ? typeOfMime(file.type) === 'image' : only === 'image';
  const altMissing = isImage && !alt.trim();
  const canUpload = !!file && !problem && !altMissing && !upload.isPending;

  const choose = (f: File | undefined) => {
    setFile(f ?? null);
    setError('');
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    choose(e.dataTransfer.files[0]);
  };

  const submit = () => {
    if (!file || !canUpload) return;
    upload.mutate(
      { file, alt: alt.trim() },
      {
        onSuccess: (item) => {
          setFile(null);
          setAlt('');
          if (inputRef.current) inputRef.current.value = '';
          onUploaded?.(item);
        },
        onError: (err) => {
          // The page shows its own banner for missing storage; the picker shows it inline.
          if (isStorageMissing(err) && onStorageMissing) onStorageMissing();
          else setError(isStorageMissing(err) ? STORAGE_MISSING : mediaErrorMessage(err));
        },
      },
    );
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center gap-2 rounded-md border-2 border-dashed p-6 text-center text-sm',
          over ? 'border-copper bg-copper/5' : 'border-border',
        )}
      >
        <UploadCloud className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p>
          Drag a file here, or{' '}
          <label htmlFor={fileId} className="cursor-pointer font-medium text-copper underline">
            browse
          </label>
          .
        </p>
        <p className="text-xs text-muted-foreground">
          {only === 'image'
            ? 'JPG, PNG, WebP or AVIF up to 8 MB.'
            : 'Images up to 8 MB, PDF up to 5 MB, MP4 up to 50 MB.'}
        </p>
        <input
          ref={inputRef}
          id={fileId}
          type="file"
          aria-label="File"
          accept={acceptFor(only)}
          className="sr-only"
          onChange={(e) => choose(e.target.files?.[0])}
        />
        {file && (
          <p className="text-sm">
            <span className="font-medium">{file.name}</span>{' '}
            <span className="text-muted-foreground">({formatBytes(file.size)})</span>
          </p>
        )}
        {problem && <p className="text-xs font-medium text-destructive">{problem}</p>}
      </div>
      <div className="space-y-1">
        <label htmlFor={altId} className="text-sm font-medium">
          Alt text{isImage && <span className="text-destructive"> *</span>}
        </label>
        <Input
          id={altId}
          value={alt}
          maxLength={200}
          placeholder="Describe what the image shows"
          onChange={(e) => setAlt(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {isImage
            ? 'Required for images, so screen-reader users know what they show.'
            : 'Optional for PDFs and videos.'}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="button" onClick={submit} disabled={!canUpload}>
        {upload.isPending ? 'Uploading…' : 'Upload'}
      </Button>
    </div>
  );
}
