import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api, type ApiErrorBody, type ApiMeta } from '@/lib/api';

/** Status enums, verbatim from backend/src/models/{Inquiry,Message,Application}.ts. */
export const STATUSES = {
  inquiries: ['new', 'contacted', 'quoted', 'won', 'lost', 'spam'],
  messages: ['new', 'read', 'replied', 'spam'],
  applications: ['new', 'reviewing', 'shortlisted', 'rejected', 'hired'],
} as const;

export type InboxKind = keyof typeof STATUSES;
export type InboxStatus<K extends InboxKind = InboxKind> = (typeof STATUSES)[K][number];

export const STATUS_LABEL: Record<InboxStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  quoted: 'Quoted',
  won: 'Won',
  lost: 'Lost',
  spam: 'Spam',
  read: 'Read',
  replied: 'Replied',
  reviewing: 'Reviewing',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  hired: 'Hired',
};

/** Audit `entity` name of each inbox kind (see the services' auditService.record calls). */
export const ENTITY: Record<InboxKind, string> = {
  inquiries: 'Inquiry',
  messages: 'Message',
  applications: 'Application',
};

const SINGULAR: Record<InboxKind, string> = {
  inquiries: 'inquiry',
  messages: 'message',
  applications: 'application',
};

export interface InboxDoc {
  id: string;
  status: InboxStatus;
  createdAt: string;
  [field: string]: unknown;
}

export interface InboxList {
  data: InboxDoc[];
  /** `counts` only on inquiries: per-status totals ignoring the status filter. */
  meta: ApiMeta & { counts?: Partial<Record<InboxStatus, number>> };
}

export interface InboxParams {
  page: number;
  limit: number;
  status?: string | undefined;
  q?: string | undefined;
}

/** Drops empty params so the request (and the CSV export) only carries real filters. */
export function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );
}

const keyOf = (kind: InboxKind) => ['admin', kind] as const;

/** One page of an inbox. Key: ['admin', kind, 'list', params]. */
export function useInboxList(kind: InboxKind, params: InboxParams) {
  return useQuery({
    queryKey: [...keyOf(kind), 'list', params],
    queryFn: async () =>
      (await api.get<InboxList>(`/admin/${kind}`, { params: cleanParams({ ...params }) })).data,
    placeholderData: keepPreviousData,
  });
}

/** One inbox record. Key: ['admin', kind, 'item', id]. */
export function useInboxItem(kind: InboxKind, id: string | undefined) {
  return useQuery({
    queryKey: [...keyOf(kind), 'item', id],
    queryFn: async () => (await api.get<{ data: InboxDoc }>(`/admin/${kind}/${id}`)).data.data,
    enabled: !!id,
  });
}

function statusErrorMessage(err: unknown, singular: string): string {
  if (isAxiosError<ApiErrorBody>(err) && err.response) {
    if (err.response.status === 403)
      return `Your role can't change the status of this ${singular}.`;
    if (err.response.status === 404) return `This ${singular} no longer exists.`;
  }
  return `Couldn't change the ${singular} status. Please try again.`;
}

type Snapshot = [QueryKey, unknown][];

/**
 * PATCH `{ status }` with an optimistic update of every cached list row and item of `kind`;
 * a failure restores the previous cache and toasts. `silent` skips the success toast
 * (used when opening a new message marks it read).
 */
export function useSetStatus(kind: InboxKind) {
  const qc = useQueryClient();
  const singular = SINGULAR[kind];
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InboxStatus; silent?: boolean }) =>
      (await api.patch<{ data: InboxDoc }>(`/admin/${kind}/${id}`, { status })).data.data,
    onMutate: async ({ id, status }): Promise<{ snapshot: Snapshot }> => {
      await qc.cancelQueries({ queryKey: keyOf(kind) });
      const snapshot = qc.getQueriesData({ queryKey: keyOf(kind) });
      const patch = (doc: InboxDoc) => (doc.id === id ? { ...doc, status } : doc);
      for (const [key, value] of snapshot) {
        if (!value) continue;
        if (key[2] === 'list') {
          const list = value as InboxList;
          qc.setQueryData(key, { ...list, data: list.data.map(patch) });
        } else if (key[2] === 'item') {
          qc.setQueryData(key, patch(value as InboxDoc));
        }
      }
      return { snapshot };
    },
    onError: (err, _vars, ctx) => {
      for (const [key, value] of ctx?.snapshot ?? []) qc.setQueryData(key, value);
      toast.error(statusErrorMessage(err, singular));
    },
    onSuccess: (_doc, { status, silent }) => {
      if (!silent) toast.success(`Status set to ${STATUS_LABEL[status]}`);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: keyOf(kind) });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
}

/** "9 Oct 2026, 14:00" in the viewer's time zone. */
export function formatDateTime(iso: unknown): string {
  if (typeof iso !== 'string') return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Local calendar date as YYYY-MM-DD (CSV file names). */
export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * `?status=` and `?page=` of an inbox list, kept in the URL so dashboard links land
 * pre-filtered and Back restores the page. Unknown statuses are ignored.
 */
export function useInboxSearch(kind: InboxKind) {
  const [search, setSearch] = useSearchParams();
  const raw = search.get('status');
  const status =
    raw && (STATUSES[kind] as readonly string[]).includes(raw) ? (raw as InboxStatus) : undefined;
  const page = Math.max(1, Math.floor(Number(search.get('page'))) || 1);

  const update = (mutate: (p: URLSearchParams) => void) =>
    setSearch(
      (prev) => {
        const p = new URLSearchParams(prev);
        mutate(p);
        return p;
      },
      { replace: true },
    );

  return {
    status,
    page,
    setStatus: (next: InboxStatus | undefined) =>
      update((p) => {
        if (next) p.set('status', next);
        else p.delete('status');
        p.delete('page');
      }),
    setPage: (next: number) =>
      update((p) => {
        if (next > 1) p.set('page', String(next));
        else p.delete('page');
      }),
    clear: () => update((p) => [...p.keys()].forEach((k) => p.delete(k))),
  };
}
