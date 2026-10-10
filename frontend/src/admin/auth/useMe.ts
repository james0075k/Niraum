import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError, type AxiosError } from 'axios';
import { api, type ApiErrorBody, type ApiItem } from '@/lib/api';
import type { Role } from './roles';

export type { Role } from './roles';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  lastLoginAt?: string;
}

export const ME_KEY = ['admin', 'me'] as const;

export interface LoginInput {
  email: string;
  password: string;
  captchaToken?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/**
 * The signed-in admin, or `null` when there is no session. `/auth/*` calls skip the api
 * interceptor's refresh, so an expired access cookie is refreshed here once (refresh returns
 * the user) before giving up.
 */
async function fetchMe(): Promise<AdminUser | null> {
  try {
    const res = await api.get<ApiItem<AdminUser>>('/auth/me');
    return res.data.data;
  } catch (err) {
    if (!isAxiosError(err) || err.response?.status !== 401) throw err;
  }
  try {
    const res = await api.post<ApiItem<AdminUser>>('/auth/refresh');
    return res.data.data ?? null;
  } catch {
    return null;
  }
}

export function useMe(): UseQueryResult<AdminUser | null> {
  return useQuery({ queryKey: ME_KEY, queryFn: fetchMe, retry: false, staleTime: 60_000 });
}

export function useLogin(): UseMutationResult<AdminUser, AxiosError<ApiErrorBody>, LoginInput> {
  const qc = useQueryClient();
  return useMutation<AdminUser, AxiosError<ApiErrorBody>, LoginInput>({
    mutationFn: async (input) => {
      const res = await api.post<ApiItem<AdminUser>>('/auth/login', input);
      return res.data.data;
    },
    onSuccess: (user) => qc.setQueryData(ME_KEY, user),
  });
}

export function useLogout(): UseMutationResult<void, Error, void> {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    // Signed out locally even if the request failed (cookies may already be gone).
    onSettled: () => {
      qc.removeQueries({ predicate: (q) => q.queryKey[0] === 'admin' });
      qc.setQueryData(ME_KEY, null);
    },
  });
}

export function useChangePassword(): UseMutationResult<
  AdminUser,
  AxiosError<ApiErrorBody>,
  ChangePasswordInput
> {
  const qc = useQueryClient();
  return useMutation<AdminUser, AxiosError<ApiErrorBody>, ChangePasswordInput>({
    mutationFn: async (input) => {
      const res = await api.post<ApiItem<AdminUser>>('/auth/change-password', input);
      return res.data.data;
    },
    onSuccess: (user) => qc.setQueryData(ME_KEY, user),
  });
}

/** The API error code of a failed request (`undefined` for network errors). */
export function errorCode(err: unknown): string | undefined {
  return isAxiosError<ApiErrorBody>(err) ? err.response?.data?.error?.code : undefined;
}
