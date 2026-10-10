import { Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResourceTable } from '../components/ResourceTable';
import { useAdminList, type AdminListParams } from '../hooks/useAdminList';
import { useAdminMutation } from '../hooks/useAdminMutation';
import { adminPathOf, getResource, type ResourceKey } from '../resources/config';

const PAGE_SIZE = 20;
const ALL = '__all';

type StateTab = 'all' | 'draft' | 'published';
type Bulk = 'publish' | 'unpublish' | 'trash' | 'restore';

const BULK_DONE: Record<Bulk, string> = {
  publish: 'published',
  unpublish: 'unpublished',
  trash: 'moved to trash',
  restore: 'restored',
};

/**
 * List page of a resource: debounced search, Draft/Published tabs, trash view, filters,
 * sortable columns, 20 per page, bulk Publish / Unpublish / Move to trash (Restore in trash).
 */
export default function ResourceList({ resource }: { resource: ResourceKey }) {
  const cfg = getResource(resource);
  const navigate = useNavigate();
  const base = adminPathOf(cfg);
  const plural = cfg.label.toLowerCase();
  const jobs = cfg.visibleField === 'isOpen';

  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [state, setState] = useState<StateTab>('all');
  const [trash, setTrash] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  // Search waits for a 300 ms pause in typing.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = qInput.trim();
      if (next === q) return;
      setQ(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [qInput, q]);

  const params = useMemo<AdminListParams>(
    () => ({ page, limit: PAGE_SIZE, q: q || undefined, sort, state, trash, ...filters }),
    [page, q, sort, state, trash, filters],
  );
  const list = useAdminList(cfg, params);
  const { update, remove, restore } = useAdminMutation(cfg);

  // A new query (page, filters…) starts with nothing selected.
  const [selectionFor, setSelectionFor] = useState(params);
  if (selectionFor !== params) {
    setSelectionFor(params);
    if (selected.size) setSelected(new Set());
  }

  const rows = (list.data?.data ?? []) as (Record<string, unknown> & { id: string })[];
  const meta = list.data?.meta;
  const filtered = !!q || state !== 'all' || trash || Object.keys(filters).length > 0;

  const reset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };

  const runBulk = async (action: Bulk) => {
    const ids = rows.filter((r) => selected.has(r.id)).map((r) => r.id);
    if (!ids.length) return;
    setBusy(true);
    let ok = 0;
    // One request at a time keeps audit order predictable and the API unhurried.
    for (const id of ids) {
      try {
        if (action === 'trash') await remove.mutateAsync({ id, silent: true });
        else if (action === 'restore') await restore.mutateAsync({ id, silent: true });
        else {
          await update.mutateAsync({
            id,
            body: { [cfg.visibleField]: action === 'publish' },
            silent: true,
          });
        }
        ok += 1;
      } catch {
        // Counted below; the summary toast reports failures.
      }
    }
    setBusy(false);
    setSelected(new Set());
    const noun = (n: number) => (n === 1 ? cfg.singular : plural);
    const failed = ids.length - ok;
    if (!failed) toast.success(`${ok} ${noun(ok)} ${BULK_DONE[action]}`);
    else {
      toast.error(
        `${ok} of ${ids.length} ${noun(ids.length)} ${BULK_DONE[action]}; ${failed} failed. Please try again.`,
      );
    }
  };

  const newLabel = `New ${cfg.singular}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{cfg.label}</h1>
          {meta && (
            <p className="text-sm tabular-nums text-muted-foreground">
              {meta.total} {meta.total === 1 ? cfg.singular : plural}
              {trash ? ' in trash' : ''}
            </p>
          )}
        </div>
        <Button asChild>
          <Link to={`${base}/new`}>
            <Plus aria-hidden="true" />
            {newLabel}
          </Link>
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[12rem] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label={`Search ${plural}`}
            placeholder={`Search ${plural}`}
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={state} onValueChange={(v) => reset(setState)(v as StateTab)}>
          <TabsList aria-label="Filter by status">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">{jobs ? 'Closed' : 'Draft'}</TabsTrigger>
            <TabsTrigger value="published">{jobs ? 'Open' : 'Published'}</TabsTrigger>
          </TabsList>
        </Tabs>
        {cfg.filters?.map((f) => (
          <Select
            key={f.key}
            value={filters[f.key] ?? ALL}
            onValueChange={(v) =>
              reset(setFilters)(
                v === ALL
                  ? Object.fromEntries(Object.entries(filters).filter(([k]) => k !== f.key))
                  : { ...filters, [f.key]: v },
              )
            }
          >
            <SelectTrigger className="w-44" aria-label={f.label}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All ({f.label.toLowerCase()})</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        <Button
          type="button"
          variant={trash ? 'secondary' : 'outline'}
          size="sm"
          aria-pressed={trash}
          onClick={() => reset(setTrash)(!trash)}
        >
          <Trash2 aria-hidden="true" />
          Trash
        </Button>
      </div>

      {selected.size > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 px-4 py-2"
        >
          <span className="mr-auto text-sm tabular-nums">{selected.size} selected</span>
          {trash ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void runBulk('restore')}
            >
              Restore
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void runBulk('publish')}
              >
                {jobs ? 'Open' : 'Publish'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void runBulk('unpublish')}
              >
                {jobs ? 'Close' : 'Unpublish'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void runBulk('trash')}
              >
                Move to trash
              </Button>
            </>
          )}
        </div>
      )}

      {list.isError ? (
        <div role="alert" className="space-y-3 rounded-xl border p-6">
          <p>Couldn&apos;t load the {plural}.</p>
          <Button variant="outline" onClick={() => void list.refetch()}>
            Try again
          </Button>
        </div>
      ) : !list.data ? (
        <div className="space-y-2" role="status" aria-label={`Loading ${plural}`}>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-dashed p-10 text-center">
          {filtered ? (
            <>
              <p className="font-medium">No {plural} match.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setQInput('');
                  setQ('');
                  setState('all');
                  setTrash(false);
                  setFilters({});
                  setPage(1);
                }}
              >
                Clear search and filters
              </Button>
            </>
          ) : (
            <>
              <p className="font-medium">No {plural} yet.</p>
              <Button asChild variant="outline">
                <Link to={`${base}/new`}>Add your first {cfg.singular}</Link>
              </Button>
            </>
          )}
        </div>
      ) : (
        <ResourceTable
          cfg={cfg}
          rows={rows}
          sort={sort}
          onSort={reset(setSort)}
          selected={selected}
          onSelectedChange={setSelected}
          onOpen={(row) => navigate(`${base}/${row.id}`)}
        />
      )}

      {meta && meta.pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-end gap-2">
          <span className="mr-2 text-sm tabular-nums text-muted-foreground">
            Page {meta.page} of {meta.pages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= meta.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
