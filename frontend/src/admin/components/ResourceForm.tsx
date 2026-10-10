import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch, type FieldValues } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ApiErrorBody } from '@/lib/api';
import { useUnsavedGuard } from '../hooks/useUnsavedGuard';
import {
  statusOf,
  type FieldDef,
  type ResourceConfig,
  type ResourceStatus,
} from '../resources/config';
import { buildBody, docToForm, emptyValues, formPathFor, toLocalInput } from '../resources/form';
import { ConfirmDialog } from './ConfirmDialog';
import { ResourceField } from './ResourceField';
import { SeoPreview } from './SeoPreview';
import { SlugField } from './SlugField';
import { StatusBadge } from './StatusBadge';

type Doc = Record<string, unknown>;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** Fields grouped by `section`, in the order sections first appear. */
function groupFields(fields: FieldDef[]): [string, FieldDef[]][] {
  const groups = new Map<string, FieldDef[]>();
  for (const f of fields) {
    const key = f.section ?? 'Details';
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  return [...groups];
}

const tomorrowNine = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return toLocalInput(d.toISOString());
};

/**
 * Edit form of one resource: fields grouped by section on the left; a sidebar with status
 * (Draft / Published / Scheduled when `schedulable`), slug, "View on site", SEO and actions.
 * Save (also Ctrl/Cmd+S) sends every field on create and only the changed ones on update;
 * localized fields send `{ en }` unless Nepali was edited. Unsaved changes are guarded.
 */
export function ResourceForm({
  cfg,
  doc,
  onSave,
  onDelete,
  onRestore,
}: {
  cfg: ResourceConfig;
  /** The admin doc, or null for a new one. */
  doc: Doc | null;
  /** Creates/updates; resolves with the saved doc, rejects with the API error. */
  onSave(body: Doc, isNew: boolean): Promise<Doc>;
  onDelete?(): Promise<void>;
  onRestore?(): Promise<void>;
}) {
  const isNew = !doc;
  const defaults = useMemo(() => (doc ? docToForm(cfg, doc) : emptyValues(cfg)), [cfg, doc]);
  const form = useForm<FieldValues>({
    resolver: zodResolver(cfg.schema),
    defaultValues: defaults,
  });
  // Reading dirtyFields subscribes to it (the payload needs it).
  const { isDirty, isSubmitting, dirtyFields } = form.formState;
  useUnsavedGuard(isDirty);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    const body = buildBody(cfg, values, dirtyFields as Doc, isNew);
    if (!isNew && Object.keys(body).length === 0) return;
    try {
      const saved = await onSave(body, isNew);
      form.reset(docToForm(cfg, saved));
    } catch (err) {
      const details = isAxiosError<ApiErrorBody>(err)
        ? (err.response?.data?.error?.details as
            { fieldErrors?: Record<string, string[] | undefined> } | undefined)
        : undefined;
      for (const [path, messages] of Object.entries(details?.fieldErrors ?? {})) {
        if (messages?.[0]) form.setError(formPathFor(cfg, path), { message: messages[0] });
      }
      if (isAxiosError<ApiErrorBody>(err) && err.response?.status === 409) {
        form.setError('slug', { message: 'This slug is already in use.' });
      }
      setError(
        isAxiosError<ApiErrorBody>(err) ? (err.response?.data?.error?.message ?? null) : null,
      );
    }
  });

  // Ctrl/Cmd+S saves.
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void submitRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const visible = useWatch({ control: form.control, name: cfg.visibleField }) as boolean;
  const publishedAt = useWatch({ control: form.control, name: 'publishedAt' }) as
    string | undefined;
  const titleValue = useWatch({ control: form.control, name: cfg.titleField }) as
    string | { en?: string } | undefined;
  const titleText = (typeof titleValue === 'string' ? titleValue : titleValue?.en) ?? '';
  const titleLocalized = cfg.localized.includes(cfg.titleField);
  const seo = useWatch({ control: form.control, name: 'seo' }) as
    { title?: string; description?: string } | undefined;
  const summary = useWatch({ control: form.control, name: 'summary.en' }) as string | undefined;

  // What the status will be after saving (local `datetime-local` value → ISO for the check).
  const publishAtIso =
    publishedAt && !Number.isNaN(new Date(publishedAt).getTime())
      ? new Date(publishedAt).toISOString()
      : null;
  const formStatus: ResourceStatus = statusOf(
    { [cfg.visibleField]: visible, publishedAt: publishAtIso },
    cfg,
  );
  const savedStatus = doc ? statusOf(doc, cfg) : 'draft';
  const jobs = cfg.visibleField === 'isOpen';

  const setStatus = (next: string) => {
    const opts = { shouldDirty: true };
    form.setValue(cfg.visibleField, next !== 'draft', opts);
    if (!cfg.schedulable) return;
    const future = publishedAt && new Date(publishedAt).getTime() > Date.now();
    if (next === 'scheduled' && !future) form.setValue('publishedAt', tomorrowNine(), opts);
    if (next === 'published' && future)
      form.setValue('publishedAt', toLocalInput(new Date().toISOString()), opts);
  };

  const deleted = doc?.isDeleted === true;

  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          {deleted && (
            <div
              role="status"
              className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/40 p-4"
            >
              <span className="mr-auto text-sm">
                This {cfg.singular} is in the trash and hidden from the site.
              </span>
              {onRestore && (
                <Button type="button" variant="outline" size="sm" onClick={() => void onRestore()}>
                  Restore
                </Button>
              )}
            </div>
          )}
          {groupFields(cfg.fields).map(([section, fields]) => (
            <Card key={section} title={section}>
              {fields.map((f) => (
                <ResourceField key={f.name} def={f} name={f.name} />
              ))}
            </Card>
          ))}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card title="Publish">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Now</span>
              <StatusBadge status={savedStatus} visibleField={cfg.visibleField} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resource-status">Status</Label>
              <Select value={formStatus} onValueChange={setStatus}>
                <SelectTrigger id="resource-status" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{jobs ? 'Closed' : 'Draft'}</SelectItem>
                  <SelectItem value="published">{jobs ? 'Open' : 'Published'}</SelectItem>
                  {cfg.schedulable && <SelectItem value="scheduled">Scheduled</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            {cfg.schedulable && visible && (
              <div className="space-y-1.5">
                <Label htmlFor="resource-published-at">Publish at</Label>
                <Input
                  id="resource-published-at"
                  type="datetime-local"
                  {...form.register('publishedAt')}
                />
              </div>
            )}
            {cfg.slug && (
              <SlugField
                source={titleLocalized ? `${cfg.titleField}.en` : cfg.titleField}
                isNew={isNew}
              />
            )}
            {cfg.publicUrl && !isNew && (
              <div className="flex flex-wrap gap-2">
                {(['en', 'ne'] as const).map((lang) =>
                  savedStatus === 'published' && doc ? (
                    <Button key={lang} asChild variant="outline" size="sm">
                      <a href={cfg.publicUrl?.(doc, lang)} target="_blank" rel="noreferrer">
                        <ExternalLink aria-hidden="true" />
                        View on site ({lang.toUpperCase()})
                      </a>
                    </Button>
                  ) : (
                    <Button key={lang} type="button" variant="outline" size="sm" disabled>
                      <ExternalLink aria-hidden="true" />
                      View on site ({lang.toUpperCase()})
                    </Button>
                  ),
                )}
                {savedStatus !== 'published' && (
                  <p className="w-full text-xs text-muted-foreground">
                    Publish and save to view it on the site.
                  </p>
                )}
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
              <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty)}>
                {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                Save
              </Button>
              {!isNew && onDelete && !deleted && (
                <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>
                  <Trash2 aria-hidden="true" />
                  Delete
                </Button>
              )}
              <span className="w-full text-xs text-muted-foreground">
                {isDirty ? 'Unsaved changes · ' : ''}Ctrl+S to save
              </span>
            </div>
          </Card>

          {cfg.seo && (
            <Card title="Search engines">
              <ResourceField
                def={{
                  name: 'title',
                  label: 'SEO title',
                  kind: 'text',
                  max: 70,
                  help: 'Empty = the name.',
                }}
                name="seo.title"
              />
              <ResourceField
                def={{
                  name: 'description',
                  label: 'SEO description',
                  kind: 'textarea',
                  max: 170,
                  help: 'Empty = the summary.',
                }}
                name="seo.description"
              />
              <ResourceField
                def={{ name: 'ogImage', label: 'Share image URL', kind: 'text', max: 1000 }}
                name="seo.ogImage"
              />
              <ResourceField
                def={{ name: 'noindex', label: 'Hide from search engines', kind: 'switch' }}
                name="seo.noindex"
              />
              <SeoPreview
                title={seo?.title || titleText}
                description={seo?.description || summary || ''}
              />
            </Card>
          )}
        </aside>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title={`Move this ${cfg.singular} to the trash?`}
        description="It disappears from the site. You can restore it from the trash."
        confirmLabel="Move to trash"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          // Leaving after delete must not ask about unsaved edits.
          form.reset(defaults);
          void onDelete?.();
        }}
      />
    </Form>
  );
}
