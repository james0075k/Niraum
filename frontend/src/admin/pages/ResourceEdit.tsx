import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ResourceForm } from '../components/ResourceForm';
import { useAdminItem } from '../hooks/useAdminList';
import { useAdminMutation } from '../hooks/useAdminMutation';
import { useBreadcrumb } from '../hooks/useBreadcrumb';
import { adminPathOf, getResource, type ResourceKey } from '../resources/config';

type Doc = Record<string, unknown>;

/** Create (`…/new`) or edit (`…/:id`) one document of a resource. */
export default function ResourceEdit({ resource }: { resource: ResourceKey }) {
  const cfg = getResource(resource);
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const base = adminPathOf(cfg);
  const item = useAdminItem(cfg, id);
  const { create, update, remove, restore } = useAdminMutation(cfg);

  const doc = id ? item.data : null;
  const title = doc?.[cfg.titleField];
  useBreadcrumb(id ? (typeof title === 'string' ? title : '') : `New ${cfg.singular}`);

  const onSave = async (body: Doc, isNew: boolean): Promise<Doc> => {
    if (isNew) {
      const saved = await create.mutateAsync({ body });
      const newId = String(saved.id);
      qc.setQueryData(['admin', cfg.key, 'item', newId], saved);
      navigate(`${base}/${newId}`, { replace: true });
      return saved;
    }
    return update.mutateAsync({ id: id as string, body });
  };

  const heading = id ? (typeof title === 'string' && title) || cfg.singular : `New ${cfg.singular}`;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Button asChild variant="link" className="h-auto px-0">
          <Link to={base}>
            <ArrowLeft aria-hidden="true" />
            All {cfg.label.toLowerCase()}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{heading}</h1>
      </header>

      {id && item.isError ? (
        <div role="alert" className="space-y-3 rounded-xl border p-6">
          <p>Couldn&apos;t load this {cfg.singular}.</p>
          <Button variant="outline" onClick={() => void item.refetch()}>
            Try again
          </Button>
        </div>
      ) : id && !doc ? (
        <div className="space-y-4" role="status" aria-label={`Loading ${cfg.singular}`}>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <ResourceForm
          key={id ?? 'new'}
          cfg={cfg}
          doc={doc ?? null}
          onSave={onSave}
          onDelete={
            id
              ? async () => {
                  await remove.mutateAsync({ id }).catch(() => undefined);
                  navigate(base);
                }
              : undefined
          }
          onRestore={
            id
              ? async () => void (await restore.mutateAsync({ id }).catch(() => undefined))
              : undefined
          }
        />
      )}
    </div>
  );
}
