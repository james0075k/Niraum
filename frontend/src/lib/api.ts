import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/** API envelope shared with backend (see docs/API.md). */
export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
export interface ApiList<T> {
  data: T[];
  meta: ApiMeta;
}
export interface ApiItem<T> {
  data: T;
}
export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

const baseURL =
  (import.meta.env.SSR ? import.meta.env.SSG_API_URL : undefined) ??
  import.meta.env.VITE_API_URL ??
  '/api/v1';

/** Auth uses httpOnly cookies, so requests must carry credentials. */
export const api = axios.create({ baseURL, withCredentials: true, timeout: 15_000 });

// Single-flight refresh: on 401, call /auth/refresh once, then retry queued requests.
let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthCall = original?.url?.startsWith('/auth/');
    if (error.response?.status !== 401 || !original || original._retry || isAuthCall) {
      throw error;
    }
    original._retry = true;
    refreshing ??= api.post('/auth/refresh').then(
      () => undefined,
      (e: unknown) => {
        throw e;
      },
    );
    try {
      await refreshing;
    } finally {
      refreshing = null;
    }
    return api(original);
  },
);
