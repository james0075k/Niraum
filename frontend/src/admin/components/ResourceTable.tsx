import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminPathOf, statusOf, type ResourceConfig } from '../resources/config';
import { StatusBadge } from './StatusBadge';

type Row = Record<string, unknown> & { id: string };

const text = (v: unknown) => (v === undefined || v === null || v === '' ? '—' : String(v));

/**
 * Rows of one resource: selection checkboxes, sortable headers (`key` → `-key` → `key`),
 * title cell linking to the edit page; clicking anywhere else on a row opens it too.
 */
export function ResourceTable({
  cfg,
  rows,
  sort,
  onSort,
  selected,
  onSelectedChange,
  onOpen,
}: {
  cfg: ResourceConfig;
  rows: Row[];
  sort: string | undefined;
  onSort(sort: string): void;
  selected: ReadonlySet<string>;
  onSelectedChange(next: Set<string>): void;
  onOpen(row: Row): void;
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = !allSelected && rows.some((r) => selected.has(r.id));
  const base = adminPathOf(cfg);

  const toggle = (id: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(id);
    else next.delete(id);
    onSelectedChange(next);
  };

  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                aria-label="Select all"
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={(v) =>
                  onSelectedChange(v === true ? new Set(rows.map((r) => r.id)) : new Set())
                }
              />
            </TableHead>
            {cfg.columns.map((col) => {
              const dir =
                sort === col.key ? 'ascending' : sort === `-${col.key}` ? 'descending' : undefined;
              return (
                <TableHead key={col.key} aria-sort={col.sortable ? (dir ?? 'none') : undefined}>
                  {col.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => onSort(sort === col.key ? `-${col.key}` : col.key)}
                    >
                      {col.label}
                      {dir === 'ascending' ? (
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : dir === 'descending' ? (
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={selected.has(row.id) ? 'selected' : undefined}
              className="cursor-pointer"
              onClick={() => onOpen(row)}
            >
              <TableCell onClick={stop}>
                <Checkbox
                  aria-label={`Select ${text(row[cfg.titleField])}`}
                  checked={selected.has(row.id)}
                  onCheckedChange={(v) => toggle(row.id, v === true)}
                />
              </TableCell>
              {cfg.columns.map((col) => (
                <TableCell
                  key={col.key}
                  className={col.key === 'order' ? 'tabular-nums' : undefined}
                >
                  {col.render ? (
                    col.render(row)
                  ) : col.key === 'status' ? (
                    <StatusBadge status={statusOf(row, cfg)} visibleField={cfg.visibleField} />
                  ) : col.key === cfg.titleField ? (
                    <Link
                      to={`${base}/${row.id}`}
                      onClick={stop}
                      className="font-medium hover:text-copper-ink hover:underline"
                    >
                      {text(row[col.key])}
                    </Link>
                  ) : (
                    text(row[col.key])
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
