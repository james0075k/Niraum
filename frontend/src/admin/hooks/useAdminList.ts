import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api, type ApiList } from '@/lib/api';
import type { ResourceConfig } from '../resources/config';

export interface AdminListParams {
  page: number;
  limit: number;
  q?: string;
  sort?: string;
  state?: 'all' | 'draft' | 'published';
  trash?: boolean;
  [filter: string]: unknown;
}

/** Drops empty params; `trash` is only sent when on (`trash=true`). */
function cleanParams(params: AdminListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === false) continue;
    out[k] = v === true ? 'true' : v;
  }
  return out;
}

/**
 * Admin list of a resource (drafts included; `trash` lists soft-deleted docs). Keeps the
 * previous page on screen while the next one loads. Key: ['admin', key, 'list', params].
 */
export function useAdminList(
  cfg: ResourceConfig,
  params: AdminListParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- rows are untyped API docs
): UseQueryResult<ApiList<any>> {
  return useQuery({
    queryKey: ['admin', cfg.key, 'list', params],
    queryFn: async () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- rows are untyped API docs
      (await api.get<ApiList<any>>(cfg.apiPath, { params: cleanParams(params) })).data,
    placeholderData: keepPreviousData,
  });
}

/** One admin doc (English strings + `translations`). Key: ['admin', key, 'item', id]. */
export function useAdminItem(cfg: ResourceConfig, id: string | undefined) {
  return useQuery({
    queryKey: ['admin', cfg.key, 'item', id],
    queryFn: async () =>
      (await api.get<{ data: Record<string, unknown> }>(`${cfg.apiPath}/${id}`)).data.data,
    enabled: !!id,
  });
}
