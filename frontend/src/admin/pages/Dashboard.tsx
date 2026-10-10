import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { can } from '../auth/roles';
import { useMe } from '../auth/useMe';

interface PublishCounts {
  published: number;
  draft: number;
}

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  at: string;
  user?: { name?: string; email?: string } | null;
}

interface DashboardStats {
  content: Record<'products' | 'deposits' | 'team' | 'services', PublishCounts>;
  inbox?: { inquiriesNew: number; messagesNew: number; applicationsNew: number };
  assay: { samples: number; summaries: number; publicDetail: boolean };
  recent?: AuditEntry[];
}

const DASHBOARD_KEY = ['admin', 'dashboard'] as const;

const VERBS: Record<string, string> = {
  create: 'created',
  update: 'updated',
  delete: 'deleted',
  restore: 'restored',
  publish: 'published',
  unpublish: 'unpublished',
  login: 'signed in',
  login_failed: 'failed to sign in',
  logout: 'signed out',
  password_change: 'changed the password of',
  password_reset: 'reset the password of',
  upload: 'uploaded',
};

const when = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

function StatCard({
  to,
  title,
  value,
  detail,
}: {
  to: string;
  title: string;
  value?: number;
  detail: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-colors hover:border-copper">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {value !== undefined && (
            <p className="text-3xl font-semibold tabular-nums text-foreground">{value}</p>
          )}
          <p className="text-sm text-muted-foreground">{detail}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

const counts = (c: PublishCounts) => `${c.published} published · ${c.draft} draft`;

function RebuildButton() {
  const rebuild = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ data: { triggered: boolean } }>('/admin/rebuild');
      return res.data.data.triggered;
    },
    onSuccess: (triggered) => {
      if (triggered) toast.success('Rebuild requested. The public site updates in a few minutes.');
      else toast.error('No deploy hook is configured, so nothing was rebuilt.');
    },
    onError: () => toast.error('Could not request a rebuild. Try again.'),
  });
  return (
    <Button variant="outline" onClick={() => rebuild.mutate()} disabled={rebuild.isPending}>
      {rebuild.isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
      )}
      Rebuild public site
    </Button>
  );
}

function RecentActivity({ entries }: { entries: AuditEntry[] }) {
  return (
    <section aria-labelledby="recent-heading" className="space-y-3">
      <h2 id="recent-heading" className="text-lg font-semibold">
        Recent activity
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm"
            >
              <span>
                {e.user?.name ?? 'Someone'} {VERBS[e.action] ?? e.action} {e.entity}
              </span>
              <time dateTime={e.at} className="text-muted-foreground">
                {when.format(new Date(e.at))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Dashboard() {
  const me = useMe();
  const isAdminPlus = can(me.data?.role, 'inbox');
  const stats = useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: async () => (await api.get<{ data: DashboardStats }>('/admin/dashboard')).data.data,
  });
  const d = stats.data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        {isAdminPlus && <RebuildButton />}
      </div>

      {stats.isError && (
        <p role="alert" className="text-sm text-destructive">
          Could not load the dashboard.{' '}
          <button type="button" className="underline" onClick={() => void stats.refetch()}>
            Try again
          </button>
        </p>
      )}

      {stats.isPending && (
        <div aria-label="Loading dashboard" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}

      {d && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard to="/admin/products" title="Products" detail={counts(d.content.products)} />
            <StatCard to="/admin/deposit" title="Deposits" detail={counts(d.content.deposits)} />
            <StatCard to="/admin/team" title="Team" detail={counts(d.content.team)} />
            <StatCard to="/admin/services" title="Services" detail={counts(d.content.services)} />
            <StatCard
              to="/admin/assay"
              title="Assay data"
              detail={`${d.assay.samples} samples · ${d.assay.summaries} summaries · sample detail ${
                d.assay.publicDetail ? 'public' : 'hidden'
              }`}
            />
            {d.inbox && (
              <>
                <StatCard
                  to="/admin/inquiries?status=new"
                  title="New inquiries"
                  value={d.inbox.inquiriesNew}
                  detail="Awaiting a first response"
                />
                <StatCard
                  to="/admin/messages"
                  title="New messages"
                  value={d.inbox.messagesNew}
                  detail="Contact form"
                />
                <StatCard
                  to="/admin/applications"
                  title="New applications"
                  value={d.inbox.applicationsNew}
                  detail="Job applications"
                />
              </>
            )}
          </div>
          {d.recent && <RecentActivity entries={d.recent} />}
        </>
      )}
    </div>
  );
}
