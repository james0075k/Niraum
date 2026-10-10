import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { api, type ApiErrorBody } from '@/lib/api';
import type { ResourceConfig } from '../resources/config';

type Doc = Record<string, unknown>;

/** `silent` skips the per-call toast (bulk actions show one summary instead). */
interface Silent {
  silent?: boolean;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** User-facing message for a failed admin write. */
export function mutationErrorMessage(err: unknown, singular: string): string {
  if (isAxiosError<ApiErrorBody>(err) && err.response) {
    const { status, data } = err.response;
    if (status === 403) return `Your role can't change this ${singular}.`;
    if (status === 404) return `This ${singular} no longer exists.`;
    if (status === 409) return data?.error?.message ?? 'That slug is already in use.';
    if (status === 400 || status === 422) return 'Check the highlighted fields.';
  }
  return `Couldn't save the ${singular}. Please try again.`;
}

/**
 * Create / update / remove (soft delete) / restore for one resource. Each toasts on success
 * and failure (unless `silent`) and invalidates every ['admin', cfg.key] query.
 */
export function useAdminMutation(cfg: ResourceConfig) {
  const qc = useQueryClient();
  const name = capitalize(cfg.singular);
  const done = (message: string, silent?: boolean) => {
    if (!silent) toast.success(message);
    void qc.invalidateQueries({ queryKey: ['admin', cfg.key] });
  };
  const failed = (err: unknown, silent?: boolean) => {
    if (!silent) toast.error(mutationErrorMessage(err, cfg.singular));
  };

  const create = useMutation({
    mutationFn: async ({ body }: { body: Doc } & Silent) =>
      (await api.post<{ data: Doc }>(cfg.apiPath, body)).data.data,
    onSuccess: (_d, v) => done(`${name} created`, v.silent),
    onError: (err, v) => failed(err, v.silent),
  });

  const update = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Doc } & Silent) =>
      (await api.put<{ data: Doc }>(`${cfg.apiPath}/${id}`, body)).data.data,
    onSuccess: (saved, v) => {
      qc.setQueryData(['admin', cfg.key, 'item', v.id], saved);
      done(`${name} saved`, v.silent);
    },
    onError: (err, v) => failed(err, v.silent),
  });

  const remove = useMutation({
    mutationFn: async ({ id }: { id: string } & Silent) => {
      await api.delete(`${cfg.apiPath}/${id}`);
    },
    onSuccess: (_d, v) => done(`${name} moved to trash`, v.silent),
    onError: (err, v) => failed(err, v.silent),
  });

  const restore = useMutation({
    mutationFn: async ({ id }: { id: string } & Silent) =>
      (await api.post<{ data: Doc }>(`${cfg.apiPath}/${id}/restore`)).data.data,
    onSuccess: (_d, v) => done(`${name} restored`, v.silent),
    onError: (err, v) => failed(err, v.silent),
  });

  return { create, update, remove, restore };
}
