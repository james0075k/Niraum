import { z } from 'zod';

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z
    .string()
    .regex(/^-?[a-zA-Z]+$/)
    .optional(),
  q: z.string().trim().min(1).max(100).optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuery>;

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const listMeta = (page: number, limit: number, total: number): ListMeta => ({
  page,
  limit,
  total,
  pages: Math.max(1, Math.ceil(total / limit)),
});

/** `-createdAt` → `{ createdAt: -1 }`, restricted to an allow-list. */
export function parseSort(
  sort: string | undefined,
  allowed: readonly string[],
  fallback: Record<string, 1 | -1>,
): Record<string, 1 | -1> {
  if (!sort) return fallback;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return allowed.includes(field) ? { [field]: desc ? -1 : 1 } : fallback;
}

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
