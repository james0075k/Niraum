import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api, type ApiErrorBody, type ApiList } from '@/lib/api';

/** `/admin/media` record (docs/API.md "Media"). */
export interface MediaItem {
  id: string;
  url: string;
  publicId: string;
  type: MediaType;
  mime: string;
  alt: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
}

export type MediaType = 'image' | 'video' | 'document';

/** What a picker hands back to a form. */
export interface PickedMedia {
  url: string;
  alt: string;
  publicId?: string;
  mediaId?: string;
  width?: number;
  height?: number;
}

export const toPicked = (m: MediaItem): PickedMedia => ({
  url: m.url,
  alt: m.alt,
  publicId: m.publicId,
  mediaId: m.id,
  width: m.width,
  height: m.height,
});

const MB = 1024 * 1024;

/** Upload rules, mirroring backend/src/middlewares/upload.ts. */
export const UPLOAD_RULES: Record<
  MediaType,
  { mimes: string[]; max: number; label: string; formats: string }
> = {
  image: {
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    max: 8 * MB,
    label: 'Images',
    formats: 'JPG, PNG, WebP or AVIF',
  },
  document: { mimes: ['application/pdf'], max: 5 * MB, label: 'PDFs', formats: 'PDF' },
  video: { mimes: ['video/mp4'], max: 50 * MB, label: 'Videos', formats: 'MP4' },
};

const TYPES = Object.keys(UPLOAD_RULES) as MediaType[];

/** `accept` attribute for a file input. */
export const acceptFor = (only?: MediaType) =>
  (only ? UPLOAD_RULES[only].mimes : TYPES.flatMap((t) => UPLOAD_RULES[t].mimes)).join(',');

export const typeOfMime = (mime: string): MediaType | null =>
  TYPES.find((t) => UPLOAD_RULES[t].mimes.includes(mime)) ?? null;

/** Problem with a chosen file before it is sent, or null. */
export function fileProblem(file: File, only?: MediaType): string | null {
  const type = typeOfMime(file.type);
  if (!type || (only && type !== only)) {
    return `Use ${(only ? [only] : TYPES).map((t) => UPLOAD_RULES[t].formats).join(', ')}.`;
  }
  const rule = UPLOAD_RULES[type];
  if (file.size > rule.max) return `${rule.label} can be at most ${rule.max / MB} MB.`;
  return null;
}

export const STORAGE_MISSING = "Media storage isn't configured (Cloudinary keys missing)";

/** User-facing message for a failed media request. */
export function mediaErrorMessage(err: unknown): string {
  if (isAxiosError<ApiErrorBody>(err) && err.response) {
    const { status, data } = err.response;
    const code = data?.error?.code;
    if (code === 'STORAGE_UNAVAILABLE') return STORAGE_MISSING;
    if (code === 'STORAGE_ERROR') return 'Media storage had a problem. Please try again.';
    if (status === 413) return 'That file is too large.';
    if (status === 415) return "That file type isn't allowed, or the file doesn't match its type.";
    if (status === 403) return "Your role can't change media.";
    if (status === 400) return data?.error?.message ?? 'Check the file and alt text.';
  }
  return 'Something went wrong. Please try again.';
}

export const isStorageMissing = (err: unknown) =>
  isAxiosError<ApiErrorBody>(err) && err.response?.data?.error?.code === 'STORAGE_UNAVAILABLE';

export const MEDIA_PAGE_SIZE = 24;

export function useMediaList(params: { page: number; type?: MediaType }) {
  return useQuery({
    queryKey: ['admin', 'media', params],
    queryFn: async () =>
      (
        await api.get<ApiList<MediaItem>>('/admin/media', {
          params: { page: params.page, limit: MEDIA_PAGE_SIZE, type: params.type },
        })
      ).data,
    placeholderData: keepPreviousData,
  });
}

export function useMediaMutations() {
  const qc = useQueryClient();
  const refresh = () => void qc.invalidateQueries({ queryKey: ['admin', 'media'] });

  const upload = useMutation({
    mutationFn: async ({ file, alt }: { file: File; alt: string }) => {
      const body = new FormData();
      body.append('file', file);
      body.append('alt', alt);
      // Videos can be 50 MB: allow longer than the client's default 15 s.
      const res = await api.post<{ data: MediaItem }>('/admin/media', body, { timeout: 180_000 });
      return res.data.data;
    },
    onSuccess: refresh,
  });

  const updateAlt = useMutation({
    mutationFn: async ({ id, alt }: { id: string; alt: string }) =>
      (await api.patch<{ data: MediaItem }>(`/admin/media/${id}`, { alt })).data.data,
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await api.delete(`/admin/media/${id}`);
    },
    onSuccess: refresh,
  });

  return { upload, updateAlt, remove };
}

export const formatBytes = (n: number) =>
  n >= MB ? `${(n / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

/** Caption under a thumbnail: alt text (or file name) and size. */
export const mediaTitle = (item: MediaItem) =>
  item.alt || item.publicId.split('/').pop() || 'Untitled';
