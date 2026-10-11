import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ApiMeta } from '@/lib/api';
import { STATUS_LABEL, STATUSES, type InboxKind, type InboxStatus } from './inbox';

const TONE: Record<InboxStatus, string> = {
  new: 'border-transparent bg-sky-600/15 text-sky-800 dark:text-sky-300',
  contacted: 'border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-300',
  quoted: 'border-transparent bg-violet-600/15 text-violet-800 dark:text-violet-300',
  won: 'border-transparent bg-emerald-600/15 text-emerald-800 dark:text-emerald-300',
  lost: 'border-transparent bg-muted text-muted-foreground',
  spam: 'border-transparent bg-destructive/15 text-destructive',
  read: 'border-transparent bg-muted text-muted-foreground',
  replied: 'border-transparent bg-emerald-600/15 text-emerald-800 dark:text-emerald-300',
  reviewing: 'border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-300',
  shortlisted: 'border-transparent bg-violet-600/15 text-violet-800 dark:text-violet-300',
  rejected: 'border-transparent bg-muted text-muted-foreground',
  hired: 'border-transparent bg-emerald-600/15 text-emerald-800 dark:text-emerald-300',
};

export function InboxStatusBadge({ status, testId }: { status: InboxStatus; testId?: string }) {
  return (
    <Badge
      variant="outline"
      data-testid={testId}
      className={cn('whitespace-nowrap font-medium', TONE[status] ?? TONE.lost)}
    >
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

const selectClass =
  'flex h-10 w-full rounded-lg border border-input bg-background/60 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 sm:w-48';

/** Native select over every status of `kind` (any status can be chosen, not only the next). */
export function StatusSelect({
  kind,
  id,
  value,
  onChange,
  disabled,
}: {
  kind: InboxKind;
  id: string;
  value: InboxStatus;
  onChange(status: InboxStatus): void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        Status
      </label>
      <select
        id={id}
        className={selectClass}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as InboxStatus)}
      >
        {STATUSES[kind].map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * "All" + one toggle per status. With `counts` (inquiries) each chip shows its number and
 * the row reads as the sales pipeline.
 */
export function StatusChips({
  kind,
  label,
  value,
  onChange,
  counts,
}: {
  kind: InboxKind;
  label: string;
  value: string | undefined;
  onChange(status: InboxStatus | undefined): void;
  counts?: Partial<Record<InboxStatus, number>> | undefined;
}) {
  const chip = (key: InboxStatus | undefined, text: string, count?: number) => {
    const active = value === key;
    return (
      <Button
        key={key ?? 'all'}
        type="button"
        size="sm"
        variant={active ? 'secondary' : 'outline'}
        aria-pressed={active}
        onClick={() => onChange(key)}
        className="gap-2"
      >
        <span>{text}</span>
        {count !== undefined && (
          <span className="rounded-full bg-background/70 px-1.5 text-xs tabular-nums">{count}</span>
        )}
      </Button>
    );
  };
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {chip(undefined, 'All')}
      {STATUSES[kind].map((s) => chip(s, STATUS_LABEL[s], counts ? (counts[s] ?? 0) : undefined))}
    </div>
  );
}

/** Loading / error / empty states around a list body. */
export function ListState({
  label,
  isError,
  isLoading,
  isEmpty,
  filtered,
  onRetry,
  onClear,
  children,
}: {
  label: string;
  isError: boolean;
  isLoading: boolean;
  isEmpty: boolean;
  filtered: boolean;
  onRetry(): void;
  onClear(): void;
  children: ReactNode;
}) {
  if (isError) {
    return (
      <div role="alert" className="space-y-3 rounded-xl border p-6">
        <p>Couldn&apos;t load the {label}.</p>
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label={`Loading ${label}`}>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className="space-y-3 rounded-xl border border-dashed p-10 text-center">
        <p className="font-medium">{filtered ? `No ${label} match.` : `No ${label} yet.`}</p>
        {filtered && (
          <Button variant="outline" onClick={onClear}>
            Clear filters
          </Button>
        )}
      </div>
    );
  }
  return <>{children}</>;
}

export function Pager({ meta, onPage }: { meta: ApiMeta | undefined; onPage(p: number): void }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-end gap-2">
      <span className="mr-2 text-sm tabular-nums text-muted-foreground">
        Page {meta.page} of {meta.pages}
      </span>
      <Button
        size="sm"
        variant="outline"
        disabled={meta.page <= 1}
        onClick={() => onPage(meta.page - 1)}
      >
        Previous
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={meta.page >= meta.pages}
        onClick={() => onPage(meta.page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}

/** Label / value pairs of a detail view. Empty values show an em dash. */
export function Fields({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0 space-y-1">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="whitespace-pre-wrap break-words">
            {value === '' || value === null || value === undefined ? '—' : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
