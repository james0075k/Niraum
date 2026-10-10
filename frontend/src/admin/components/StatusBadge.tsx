import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ResourceStatus } from '../resources/config';

const STYLE: Record<ResourceStatus, string> = {
  published: 'border-transparent bg-emerald-600/15 text-emerald-800 dark:text-emerald-300',
  draft: 'border-transparent bg-muted text-muted-foreground',
  scheduled: 'border-transparent bg-sky-600/15 text-sky-800 dark:text-sky-300',
  trashed: 'border-transparent bg-destructive/15 text-destructive',
};

/** Draft / Published / Scheduled / In trash. Jobs (`isOpen`) read Open / Closed. */
export function StatusBadge({
  status,
  visibleField = 'published',
}: {
  status: ResourceStatus;
  visibleField?: 'published' | 'isOpen';
}) {
  const jobs = visibleField === 'isOpen';
  const label = {
    published: jobs ? 'Open' : 'Published',
    draft: jobs ? 'Closed' : 'Draft',
    scheduled: 'Scheduled',
    trashed: 'In trash',
  }[status];
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap font-medium', STYLE[status])}>
      {label}
    </Badge>
  );
}
