import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Filter, X } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, type ApiList } from '@/lib/api';
import { adminPathOf, RESOURCES, type ResourceKey } from '../resources/config';

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  at: string;
  ip?: string;
  user?: { id: string; name?: string; email?: string; role?: string } | null;
  diff?: Record<string, unknown>;
}

const LIMIT = 50;

/** Backend model names written to `AuditLog.entity`, in filter order. */
const ENTITIES = [
  'Product',
  'Deposit',
  'TeamMember',
  'Service',
  'Project',
  'Post',
  'Job',
  'Media',
  'AssaySample',
  'AssaySummary',
  'SiteSettings',
  'Inquiry',
  'Message',
  'Application',
  'User',
] as const;

/** Entities edited by the generic resource editor (linked when that resource is configured). */
const ENTITY_RESOURCE: Record<string, ResourceKey> = {
  Product: 'products',
  Deposit: 'deposits',
  TeamMember: 'team',
  Service: 'services',
  Project: 'projects',
  Post: 'posts',
  Job: 'jobs',
};

/** Admin page of an audited record, or `null` when it has no editor. */
function editorPath(e: AuditEntry): string | null {
  if (e.entity === 'SiteSettings') return '/admin/settings';
  if (e.entity === 'Inquiry' && e.entityId) return `/admin/inquiries/${e.entityId}`;
  // Messages and applications open in a drawer on their list page (no per-record route).
  if (e.entity === 'Message') return '/admin/messages';
  if (e.entity === 'Application') return '/admin/applications';
  if (e.entity === 'AssaySample' || e.entity === 'AssaySummary') return '/admin/assay';
  if (e.entity === 'Media') return '/admin/media';
  if (e.entity === 'User') return '/admin/users';
  const key = ENTITY_RESOURCE[e.entity];
  const cfg = key ? RESOURCES[key] : undefined;
  if (!cfg || !e.entityId) return null;
  return `${adminPathOf(cfg)}/${e.entityId}`;
}

const when = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'medium' });

const selectClass =
  'flex h-9 rounded-lg border border-input bg-background/60 px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

/** One value of a diff, JSON-style so strings show quoted and empties are visible. */
function show(value: unknown): string {
  if (value === undefined) return '—';
  const text = JSON.stringify(value) ?? String(value);
  return text.length > 300 ? `${text.slice(0, 300)}…` : text;
}

const isChange = (v: unknown): v is { from: unknown; to: unknown } =>
  !!v && typeof v === 'object' && !Array.isArray(v) && ('from' in v || 'to' in v);

/** The field diff: `field: before → after` for updates, `field: value` for other entries. */
function DiffList({ diff }: { diff: Record<string, unknown> }) {
  const keys = Object.keys(diff);
  if (keys.length === 0) return <p className="text-sm text-muted-foreground">No field changes.</p>;
  return (
    <ul className="space-y-1 font-mono text-xs">
      {keys.map((key) => {
        const v = diff[key];
        return (
          <li key={key} className="break-all">
            {isChange(v) ? `${key}: ${show(v.from)} → ${show(v.to)}` : `${key}: ${show(v)}`}
          </li>
        );
      })}
    </ul>
  );
}

/** Audit log (admin+): newest first, filter by entity / record / user, expandable diffs. */
export default function AuditLog() {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const entity = params.get('entity') ?? '';
  const entityId = params.get('entityId') ?? '';
  const userId = params.get('user') ?? '';
  const page = Math.max(1, Number(params.get('page')) || 1);

  /** Sets (or clears, with '') filters; any filter change goes back to page 1. */
  const setFilter = (next: Record<string, string>) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(next)) {
          if (v) p.set(k, v);
          else p.delete(k);
        }
        if (!('page' in next)) p.delete('page');
        return p;
      },
      { replace: true },
    );
    setOpen(new Set());
  };

  const query: Record<string, unknown> = { page, limit: LIMIT };
  if (entity) query.entity = entity;
  if (entityId) query.entityId = entityId;
  if (userId) query.user = userId;

  const list = useQuery({
    queryKey: ['admin', 'audit', 'list', query],
    queryFn: async () =>
      (await api.get<ApiList<AuditEntry>>('/admin/audit', { params: query })).data,
    placeholderData: keepPreviousData,
  });

  const rows = list.data?.data ?? [];
  const pages = list.data?.meta.pages ?? 1;
  const userName = rows.find((r) => r.user?.id === userId)?.user?.name ?? userId;

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Every change made in the admin, newest first. Passwords and tokens are never recorded.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="audit-entity" className="text-sm font-medium">
          Entity
        </label>
        <select
          id="audit-entity"
          className={selectClass}
          value={entity}
          onChange={(e) => setFilter({ entity: e.target.value, entityId: '' })}
        >
          <option value="">All</option>
          {ENTITIES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {entityId && (
          <Badge variant="secondary" className="gap-1">
            Record {entityId}
            <button
              type="button"
              aria-label="Clear record filter"
              onClick={() => setFilter({ entityId: '' })}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </Badge>
        )}
        {userId && (
          <Badge variant="secondary" className="gap-1">
            User {userName}
            <button
              type="button"
              aria-label="Clear user filter"
              onClick={() => setFilter({ user: '' })}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </Badge>
        )}
      </div>

      {list.isError ? (
        <div role="alert" className="space-y-3 rounded-xl border p-6">
          <p className="text-sm">Couldn&apos;t load the audit log.</p>
          <Button variant="outline" size="sm" onClick={() => void list.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <span className="sr-only">Details</span>
                </TableHead>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity id</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading ? (
                Array.from({ length: 4 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No entries match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((e) => {
                  const expanded = open.has(e.id);
                  const path = editorPath(e);
                  const name = e.user?.name ?? e.user?.email;
                  return (
                    <Fragment key={e.id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-expanded={expanded}
                            aria-controls={`audit-diff-${e.id}`}
                            aria-label={`${expanded ? 'Hide' : 'Show'} changes`}
                            onClick={() => toggle(e.id)}
                          >
                            {expanded ? (
                              <ChevronDown aria-hidden="true" />
                            ) : (
                              <ChevronRight aria-hidden="true" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">
                          {when.format(new Date(e.at))}
                        </TableCell>
                        <TableCell>
                          {e.user && name ? (
                            <span className="inline-flex items-center gap-1">
                              <span>{name}</span>
                              {e.user.id !== userId && (
                                <button
                                  type="button"
                                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                                  aria-label={`Only show ${name}`}
                                  onClick={() => setFilter({ user: e.user!.id })}
                                >
                                  <Filter className="h-3 w-3" aria-hidden="true" />
                                </button>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{e.action}</Badge>
                        </TableCell>
                        <TableCell>{e.entity}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {!e.entityId ? (
                            <span className="text-muted-foreground">—</span>
                          ) : path ? (
                            <Link to={path} className="underline underline-offset-2">
                              {e.entityId}
                            </Link>
                          ) : (
                            e.entityId
                          )}
                        </TableCell>
                      </TableRow>
                      {expanded && (
                        <TableRow id={`audit-diff-${e.id}`} className="bg-muted/30">
                          <TableCell />
                          <TableCell colSpan={5} className="space-y-2">
                            <DiffList diff={e.diff ?? {}} />
                            {e.ip && <p className="text-xs text-muted-foreground">IP {e.ip}</p>}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setFilter({ page: String(page - 1) })}
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
            onClick={() => setFilter({ page: String(page + 1) })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
