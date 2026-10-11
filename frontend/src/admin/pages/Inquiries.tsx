import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CsvButton } from '../components/CsvButton';
import { formatDateTime, today, useInboxList, useInboxSearch } from '../inbox/inbox';
import { InboxStatusBadge, ListState, Pager, StatusChips } from '../inbox/InboxUi';
import { BUYER_LABEL, formatQuantity, TOPIC_LABEL } from '../inbox/labels';

const PAGE_SIZE = 20;
const text = (v: unknown) => (v === undefined || v === null || v === '' ? '—' : String(v));

/**
 * Bulk-supply inquiries: pipeline chips with a count per status (click filters), search,
 * CSV export of the current filters, newest-first table linking to the detail page.
 * `?status=` comes from the URL so dashboard links land pre-filtered.
 */
export default function Inquiries() {
  const navigate = useNavigate();
  const { status, page, setStatus, setPage, clear } = useInboxSearch('inquiries');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');

  // Search waits for a 300 ms pause in typing and goes back to page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = qInput.trim();
      if (next === q) return;
      setQ(next);
      if (page !== 1) setPage(1);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setPage/page are read live
  }, [qInput, q]);

  const list = useInboxList('inquiries', {
    page,
    limit: PAGE_SIZE,
    status,
    q: q || undefined,
  });
  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  const filtered = !!status || !!q;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Inquiries</h1>
          {meta && (
            <p className="text-sm tabular-nums text-muted-foreground">
              {meta.total} {meta.total === 1 ? 'inquiry' : 'inquiries'}
              {filtered ? ' match' : ''}
            </p>
          )}
        </div>
        <CsvButton
          path="/admin/inquiries/export.csv"
          filename={`inquiries-${today()}.csv`}
          params={{ status, q: q || undefined }}
        />
      </header>

      <StatusChips
        kind="inquiries"
        label="Pipeline"
        value={status}
        counts={meta?.counts}
        onChange={setStatus}
      />

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label="Search inquiries"
          placeholder="Search company, name or email"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          className="pl-9"
        />
      </div>

      <ListState
        label="inquiries"
        isError={list.isError}
        isLoading={!list.data}
        isEmpty={rows.length === 0}
        filtered={filtered}
        onRetry={() => void list.refetch()}
        onClear={() => {
          setQInput('');
          setQ('');
          clear();
        }}
      >
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Received</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Buyer type</TableHead>
                <TableHead>Request</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Delivery to</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const to = `/admin/inquiries/${row.id}`;
                return (
                  <TableRow key={row.id} className="cursor-pointer" onClick={() => navigate(to)}>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {formatDateTime(row.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={to}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium hover:text-copper-ink hover:underline"
                      >
                        {text(row.companyName)}
                      </Link>
                    </TableCell>
                    <TableCell>{text(row.contactName)}</TableCell>
                    <TableCell>
                      {BUYER_LABEL[String(row.buyerType)] ?? text(row.buyerType)}
                    </TableCell>
                    <TableCell>{TOPIC_LABEL[String(row.topic)] ?? text(row.topic)}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {formatQuantity(row.quantity, row.quantityUnit)}
                    </TableCell>
                    <TableCell>{text(row.deliveryLocation)}</TableCell>
                    <TableCell>
                      <InboxStatusBadge status={row.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ListState>

      <Pager meta={meta} onPage={setPage} />
    </div>
  );
}
