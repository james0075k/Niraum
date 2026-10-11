import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api, type ApiList } from '@/lib/api';
import { useBreadcrumb } from '../hooks/useBreadcrumb';
import {
  ENTITY,
  formatDateTime,
  STATUS_LABEL,
  useInboxItem,
  useSetStatus,
  type InboxStatus,
} from '../inbox/inbox';
import { Fields, InboxStatusBadge, StatusSelect } from '../inbox/InboxUi';
import { BUYER_LABEL, formatQuantity, LANG_LABEL, telHref, TOPIC_LABEL } from '../inbox/labels';

interface AuditEntry {
  id: string;
  action: string;
  at: string;
  diff?: { status?: { from?: string; to?: string } } & Record<string, unknown>;
  user?: { name?: string; email?: string } | null;
}

const statusText = (s: string | undefined) => (s && STATUS_LABEL[s as InboxStatus]) ?? s ?? '—';

/** Status changes and other edits of one record, newest first. */
function Activity({ entity, id }: { entity: string; id: string }) {
  const audit = useQuery({
    queryKey: ['admin', 'audit', { entity, entityId: id }],
    queryFn: async () =>
      (
        await api.get<ApiList<AuditEntry>>('/admin/audit', {
          params: { entity, entityId: id, limit: 20 },
        })
      ).data,
  });
  const entries = audit.data?.data ?? [];
  return (
    <section aria-labelledby="activity-heading" className="space-y-3">
      <h2 id="activity-heading" className="text-lg font-semibold">
        Activity
      </h2>
      {audit.isError ? (
        <p className="text-sm text-muted-foreground">Couldn&apos;t load the activity.</p>
      ) : !audit.data ? (
        <Skeleton className="h-10 w-full" />
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No changes yet.</p>
      ) : (
        <ol className="space-y-3 border-l pl-4">
          {entries.map((e) => (
            <li key={e.id} className="space-y-0.5">
              <p className="text-sm">
                {e.diff?.status
                  ? `Status: ${statusText(e.diff.status.from)} → ${statusText(e.diff.status.to)}`
                  : `${e.action.charAt(0).toUpperCase()}${e.action.slice(1)}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {e.user?.name ?? e.user?.email ?? 'System'} · {formatDateTime(e.at)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** One inquiry: every field, mailto / tel links, status select and its audit trail. */
export default function InquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const item = useInboxItem('inquiries', id);
  const setStatus = useSetStatus('inquiries');
  const doc = item.data;
  useBreadcrumb(typeof doc?.companyName === 'string' ? doc.companyName : '');

  const back = (
    <Button asChild variant="ghost" size="sm" className="-ml-2">
      <Link to="/admin/inquiries">
        <ArrowLeft aria-hidden="true" />
        All inquiries
      </Link>
    </Button>
  );

  if (item.isError) {
    const gone = isAxiosError(item.error) && item.error.response?.status === 404;
    return (
      <div className="space-y-4">
        {back}
        <div role="alert" className="space-y-3 rounded-xl border p-6">
          <p>{gone ? 'This inquiry no longer exists.' : "Couldn't load the inquiry."}</p>
          {!gone && (
            <Button variant="outline" onClick={() => void item.refetch()}>
              Try again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!doc || !id) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading inquiry">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const email = String(doc.email ?? '');
  const phone = String(doc.phone ?? '');
  const str = (v: unknown) => (typeof v === 'string' ? v : '');

  return (
    <div className="space-y-6">
      {back}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{str(doc.companyName)}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <InboxStatusBadge status={doc.status} testId="status-badge" />
            <span>Received {formatDateTime(doc.createdAt)}</span>
          </div>
        </div>
        <StatusSelect
          kind="inquiries"
          id="inquiry-status"
          value={doc.status}
          disabled={setStatus.isPending}
          onChange={(status) => setStatus.mutate({ id, status })}
        />
      </header>

      <div className="flex flex-wrap gap-2">
        {email && (
          <Button asChild variant="outline" size="sm">
            <a href={`mailto:${email}`} aria-label={`Email ${str(doc.contactName)}`}>
              <Mail aria-hidden="true" />
              Reply by email
            </a>
          </Button>
        )}
        {phone && (
          <Button asChild variant="outline" size="sm">
            <a href={telHref(phone)} aria-label={`Call ${str(doc.contactName)}`}>
              <Phone aria-hidden="true" />
              Call
            </a>
          </Button>
        )}
      </div>

      <div className="rounded-xl border p-5">
        <Fields
          items={[
            ['Contact', str(doc.contactName)],
            [
              'Email',
              email && (
                <a href={`mailto:${email}`} className="text-copper-ink hover:underline">
                  {email}
                </a>
              ),
            ],
            [
              'Phone',
              phone && (
                <a href={telHref(phone)} className="text-copper-ink hover:underline">
                  {phone}
                </a>
              ),
            ],
            ['Buyer type', BUYER_LABEL[str(doc.buyerType)] ?? str(doc.buyerType)],
            ['Request', TOPIC_LABEL[str(doc.topic)] ?? str(doc.topic)],
            ['Quantity', formatQuantity(doc.quantity, doc.quantityUnit)],
            ['Delivery location', str(doc.deliveryLocation)],
            ['Specification', str(doc.specRequirement)],
            ['Language', LANG_LABEL[str(doc.lang)] ?? str(doc.lang)],
            ['Sent from page', str(doc.sourcePage)],
          ]}
        />
        <div className="mt-4 space-y-1 border-t pt-4">
          <p className="text-sm text-muted-foreground">Message</p>
          <p className="whitespace-pre-wrap break-words">{str(doc.message) || '—'}</p>
        </div>
      </div>

      <Activity entity={ENTITY.inquiries} id={id} />
    </div>
  );
}
