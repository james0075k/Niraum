import { Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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

/** Contact-form messages. Opening a `new` message marks it `read` (silently). */
export default function Messages() {
  const { status, page, setStatus, setPage, clear } = useInboxSearch('messages');
  const list = useInboxList('messages', { page, limit: PAGE_SIZE, status });
  const setMessageStatus = useSetStatus('messages');
  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;

  // The open message: the live row while it is on this page, else the last copy we saw
  // (opening a `new` message under the "New" filter drops it from the refetched list).
  const [opened, setOpened] = useState<InboxDoc | null>(null);
  const live = opened ? rows.find((r) => r.id === opened.id) : undefined;
  if (live && live !== opened) setOpened(live);

  const open = (msg: InboxDoc) => {
    setOpened(msg);
    if (msg.status === 'new') setMessageStatus.mutate({ id: msg.id, status: 'read', silent: true });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Messages</h1>
        {meta && (
          <p className="text-sm tabular-nums text-muted-foreground">
            {meta.total} {meta.total === 1 ? 'message' : 'messages'}
          </p>
        )}
      </header>

      <StatusChips kind="messages" label="Filter by status" value={status} onChange={setStatus} />

      <ListState
        label="messages"
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
                <TableHead>Subject</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={row.status === 'new' ? 'font-semibold' : undefined}
                >
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatDateTime(row.createdAt)}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => open(row)}
                      className="text-left hover:text-copper-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {str(row.subject) || '(no subject)'}
                    </button>
                  </TableCell>
                  <TableCell>{str(row.name)}</TableCell>
                  <TableCell className="font-normal">{str(row.email)}</TableCell>
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

      <Sheet open={!!opened} onOpenChange={(o) => !o && setOpened(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {opened && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>{str(opened.subject) || '(no subject)'}</SheetTitle>
                <SheetDescription>
                  From {str(opened.name)} · {formatDateTime(opened.createdAt)}
                </SheetDescription>
              </SheetHeader>
              <StatusSelect
                kind="messages"
                id="message-status"
                value={opened.status}
                disabled={setMessageStatus.isPending}
                onChange={(next) => {
                  // A row on this page follows the optimistic cache; an off-page copy is
                  // updated (and reverted) here.
                  if (live) {
                    setMessageStatus.mutate({ id: opened.id, status: next });
                    return;
                  }
                  const prev = opened.status;
                  setOpened({ ...opened, status: next });
                  setMessageStatus.mutate(
                    { id: opened.id, status: next },
                    { onError: () => setOpened((o) => (o ? { ...o, status: prev } : o)) },
                  );
                }}
              />
              <Fields
                items={[
                  ['Name', str(opened.name)],
                  [
                    'Email',
                    str(opened.email) && (
                      <a
                        href={`mailto:${str(opened.email)}`}
                        className="text-copper-ink hover:underline"
                      >
                        {str(opened.email)}
                      </a>
                    ),
                  ],
                  [
                    'Phone',
                    str(opened.phone) && (
                      <a
                        href={telHref(str(opened.phone))}
                        className="text-copper-ink hover:underline"
                      >
                        {str(opened.phone)}
                      </a>
                    ),
                  ],
                  ['Company', str(opened.company)],
                ]}
              />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Message</p>
                <p className="whitespace-pre-wrap break-words">{str(opened.message)}</p>
              </div>
              {str(opened.email) && (
                <Button asChild variant="outline">
                  <a
                    href={`mailto:${str(opened.email)}?subject=${encodeURIComponent(
                      `Re: ${str(opened.subject)}`,
                    )}`}
                  >
                    <Mail aria-hidden="true" />
                    Reply by email
                  </a>
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
