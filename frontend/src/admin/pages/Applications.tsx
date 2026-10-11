import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatDateTime,
  useInboxItem,
  useInboxList,
  useInboxSearch,
  useSetStatus,
  type InboxDoc,
} from '../inbox/inbox';
import {
  Fields,
  InboxStatusBadge,
  ListState,
  Pager,
  StatusChips,
  StatusSelect,
} from '../inbox/InboxUi';
import { telHref } from '../inbox/labels';

const PAGE_SIZE = 20;
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const kb = (bytes: unknown) =>
  typeof bytes === 'number' && bytes > 0 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : '';

/** Detail drawer: fetched on open so the CV link is a fresh short-lived signed URL. */
function ApplicationSheet({ row, onClose }: { row: InboxDoc | null; onClose(): void }) {
  const item = useInboxItem('applications', row?.id);
  const setStatus = useSetStatus('applications');
  const doc = item.data ?? row;
  const cvUrl = typeof item.data?.cvUrl === 'string' ? item.data.cvUrl : null;

  return (
    <Sheet open={!!row} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {doc && (
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>{str(doc.name)}</SheetTitle>
              <SheetDescription>
                {str(doc.jobTitle) || 'General application'} · {formatDateTime(doc.createdAt)}
              </SheetDescription>
            </SheetHeader>
            <StatusSelect
              kind="applications"
              id="application-status"
              value={doc.status}
              disabled={setStatus.isPending}
              onChange={(status) => setStatus.mutate({ id: doc.id, status })}
            />
            <div>
              {item.isLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : cvUrl ? (
                <Button asChild>
                  <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink aria-hidden="true" />
                    Open CV{kb(doc.cvBytes) ? ` (${kb(doc.cvBytes)})` : ''}
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {item.isError
                    ? "Couldn't load the CV link. Close and open the application again."
                    : 'The CV file is not available (file storage is not configured).'}
                </p>
              )}
            </div>
            <Fields
              items={[
                [
                  'Email',
                  str(doc.email) && (
                    <a
                      href={`mailto:${str(doc.email)}`}
                      className="text-copper-ink hover:underline"
                    >
                      {str(doc.email)}
                    </a>
                  ),
                ],
                [
                  'Phone',
                  str(doc.phone) && (
                    <a href={telHref(str(doc.phone))} className="text-copper-ink hover:underline">
                      {str(doc.phone)}
                    </a>
                  ),
                ],
              ]}
            />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cover note</p>
              <p className="whitespace-pre-wrap break-words">{str(doc.message) || '—'}</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Job applications: status filter, list, detail drawer with the signed CV link. */
export default function Applications() {
  const { status, page, setStatus, setPage, clear } = useInboxSearch('applications');
  const list = useInboxList('applications', { page, limit: PAGE_SIZE, status });
  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  const [opened, setOpened] = useState<InboxDoc | null>(null);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Applications</h1>
        {meta && (
          <p className="text-sm tabular-nums text-muted-foreground">
            {meta.total} {meta.total === 1 ? 'application' : 'applications'}
          </p>
        )}
      </header>

      <StatusChips
        kind="applications"
        label="Filter by status"
        value={status}
        onChange={setStatus}
      />

      <ListState
        label="applications"
        isError={list.isError}
        isLoading={!list.data}
        isEmpty={rows.length === 0}
        filtered={!!status}
        onRetry={() => void list.refetch()}
        onClear={clear}
      >
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Received</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatDateTime(row.createdAt)}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setOpened(row)}
                      className="text-left font-medium hover:text-copper-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {str(row.name)}
                    </button>
                  </TableCell>
                  <TableCell>{str(row.jobTitle) || 'General application'}</TableCell>
                  <TableCell>{str(row.email)}</TableCell>
                  <TableCell>
                    <InboxStatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ListState>

      <Pager meta={meta} onPage={setPage} />

      <ApplicationSheet row={opened} onClose={() => setOpened(null)} />
    </div>
  );
}
