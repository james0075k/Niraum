import { Download, Trash2, Upload } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseCsv, readFileText, downloadText, toCsv, type CsvRecord } from '../assay/csv';
import {
  assayErrorMessage,
  CSV_COLUMNS,
  CSV_REQUIRED,
  DATASETS,
  datasetLabel,
  importProblems,
  SAMPLE_COLUMNS,
  SUMMARY_COLUMNS,
  useAssayMutations,
  useAssaySamples,
  useAssaySummary,
  usePublicAssayDetail,
  type AssaySample,
  type Dataset,
  type ImportProblems,
} from '../assay/useAssay';
import { can } from '../auth/roles';
import { useMe } from '../auth/useMe';
import { ConfirmDialog } from '../components/ConfirmDialog';

const SOURCE_NOTE =
  'Numbers come from the assay report — change them only to match the source document.';

const show = (n: number | null) => (n === null ? '—' : String(n));

/** Checks a typed cell value; returns the number (or null) or an error message. */
function checkNumber(
  raw: string,
  field: string,
  opts: { nullable: boolean; max?: number },
): { value: number | null } | { error: string } {
  const text = raw.trim();
  if (text === '') return opts.nullable ? { value: null } : { error: `${field} is required` };
  const n = Number(text);
  if (!Number.isFinite(n)) return { error: `${field} must be a number` };
  if (n < 0 || (opts.max !== undefined && n > opts.max)) {
    return {
      error:
        opts.max === undefined
          ? `${field} must be 0 or more`
          : `${field} must be between 0 and ${opts.max}`,
    };
  }
  return { value: n };
}

/**
 * A number shown as a button; click → number input. Enter saves (only when changed),
 * Escape or leaving the field cancels.
 */
function NumberCell({
  field,
  row,
  value,
  nullable = false,
  max,
  onSave,
}: {
  field: string;
  row: string;
  value: number | null;
  nullable?: boolean;
  max?: number;
  onSave: (value: number | null) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const errorId = useId();
  const name = `${field} of ${row}`;

  const start = () => {
    setDraft(value === null ? '' : String(value));
    setError(null);
    setEditing(true);
  };
  const cancel = () => {
    if (saving) return;
    setEditing(false);
    setError(null);
  };

  const submit = async () => {
    const checked = checkNumber(draft, field, { nullable, max });
    if ('error' in checked) {
      setError(checked.error);
      return;
    }
    if (checked.value === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(checked.value);
      setEditing(false);
    } catch {
      // The caller shows the toast; keep the input open with the typed value.
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      void submit();
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={start}
        aria-label={`Edit ${name}`}
        className="w-full rounded px-1 py-0.5 text-right tabular-nums hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {show(value)}
      </button>
    );
  }
  return (
    <div className="min-w-[5.5rem]">
      <Input
        type="number"
        step="any"
        min={0}
        max={max}
        autoFocus
        value={draft}
        disabled={saving}
        aria-label={name}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
        onKeyDown={onKeyDown}
        onBlur={cancel}
        className="h-8 px-2 text-right tabular-nums"
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function TableSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

function LoadError({ what, retry }: { what: string; retry: () => void }) {
  return (
    <div role="alert" className="space-y-3 rounded-xl border p-6">
      <p className="text-sm">Couldn&apos;t load the {what}.</p>
      <Button variant="outline" size="sm" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}

/** Table 14 rows + the deposit average; numbers editable to match the report. */
function SummarySection({ dataset }: { dataset: Dataset }) {
  const summary = useAssaySummary();
  const { updateSummary } = useAssayMutations(dataset);

  return (
    <section aria-labelledby="assay-summary-title" className="space-y-3">
      <div className="space-y-1">
        <h2 id="assay-summary-title" className="text-lg font-semibold">
          Summary by section
        </h2>
        <p className="text-sm text-muted-foreground">
          Length-weighted grade per section (weight %) and the deposit-wide average shown on the
          public site.
        </p>
      </div>
      {summary.isError ? (
        <LoadError what="assay summary" retry={() => void summary.refetch()} />
      ) : !summary.data ? (
        <TableSkeleton label="Loading the assay summary" />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                {SUMMARY_COLUMNS.map((c) => (
                  <TableHead key={c.field} className="text-right">
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.data.map((r) => (
                <TableRow key={r.id} className={r.isOverall ? 'font-medium' : undefined}>
                  <TableCell>{r.section}</TableCell>
                  {SUMMARY_COLUMNS.map((c) => (
                    <TableCell key={c.field} className="p-1">
                      <NumberCell
                        field={c.label}
                        row={r.section}
                        value={r[c.field]}
                        max={c.max}
                        onSave={(value) =>
                          updateSummary.mutateAsync({ id: r.id, patch: { [c.field]: value } }).then(
                            () => toast.success(`${c.label} of ${r.section} saved`),
                            (err: unknown) => {
                              toast.error(assayErrorMessage(err));
                              throw err;
                            },
                          )
                        }
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

/** "Show sample-level data on the public site": admin+ can switch it, editors only see it. */
function PublicDetailSwitch({ isAdmin }: { isAdmin: boolean }) {
  const detail = usePublicAssayDetail(isAdmin);
  const { setPublicDetail } = useAssayMutations('grab_B_C');
  const id = useId();

  const toggle = (on: boolean) =>
    setPublicDetail.mutate(on, {
      onSuccess: () =>
        toast.success(on ? 'Sample-level data is now public' : 'Sample-level data is now hidden'),
      onError: (err) => toast.error(assayErrorMessage(err)),
    });

  return (
    <div className="flex items-start gap-3 rounded-xl border p-4">
      <Switch
        id={id}
        checked={detail.data === true}
        disabled={!isAdmin || detail.data === undefined || setPublicDetail.isPending}
        onCheckedChange={toggle}
        aria-describedby={`${id}-help`}
      />
      <div className="space-y-1">
        <Label htmlFor={id}>Show sample-level data on the public site</Label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          Off: visitors see only the summary and can request the full assay report.
          {isAdmin ? '' : ' Only admins can change this.'}
        </p>
        <p className="text-sm font-medium">
          [CONFIRM] Client permission to publish sample-level assay data is pending.
        </p>
      </div>
    </div>
  );
}

const PREVIEW_ROWS = 10;

/** Choose file → client-side preview → replace/append → POST; a 400 lists every bad line. */
function ImportDialog({ dataset, onClose }: { dataset: Dataset; onClose: () => void }) {
  const { importCsv } = useAssayMutations(dataset);
  const [text, setText] = useState<string | null>(null);
  const [records, setRecords] = useState<CsvRecord[]>([]);
  const [readError, setReadError] = useState<string | null>(null);
  const [mode, setMode] = useState<'replace' | 'append'>('replace');
  const [problems, setProblems] = useState<ImportProblems | null>(null);
  const fileId = useId();
  const label = datasetLabel(dataset);

  const choose = async (file: File | undefined) => {
    setProblems(null);
    setReadError(null);
    setText(null);
    setRecords([]);
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setReadError('The file is too large (1 MB at most).');
      return;
    }
    try {
      const content = await readFileText(file);
      setRecords(parseCsv(content));
      setText(content);
    } catch (err) {
      setReadError(err instanceof Error ? err.message : "Couldn't read the file.");
    }
  };

  const [head, ...body] = records;
  const header = head?.cells.map((c) => c.trim()) ?? [];
  const missing = head ? CSV_REQUIRED.filter((c) => !header.includes(c)) : [];
  const unknown = header.filter((h) => !(CSV_COLUMNS as readonly string[]).includes(h));
  const ready = text !== null && body.length > 0 && !missing.length && !unknown.length;

  const submit = () => {
    if (!ready || text === null) return;
    setProblems(null);
    importCsv.mutate(
      { text, mode },
      {
        onSuccess: (r) => {
          toast.success(
            `Imported ${r.inserted} sample${r.inserted === 1 ? '' : 's'}${mode === 'replace' ? ` (replaced ${r.replaced})` : ''}`,
          );
          onClose();
        },
        onError: (err) => {
          const found = importProblems(err);
          if (found) setProblems(found);
          else toast.error(assayErrorMessage(err));
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !importCsv.isPending && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import CSV into {label}</DialogTitle>
          <DialogDescription>
            Columns (any order): {CSV_COLUMNS.join(', ')}. Required: {CSV_REQUIRED.join(', ')}.
            Blank optional cells are saved as empty. Nothing is saved unless every row is valid.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor={fileId}>CSV file</Label>
            <Input
              id={fileId}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => void choose(e.target.files?.[0])}
            />
          </div>

          {readError && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {readError}
            </p>
          )}

          {head && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {body.length} row{body.length === 1 ? '' : 's'} in the file
                {body.length > PREVIEW_ROWS ? ` — showing the first ${PREVIEW_ROWS}` : ''}
              </p>
              {(missing.length > 0 || unknown.length > 0) && (
                <ul role="alert" className="list-disc pl-5 text-sm text-destructive">
                  {missing.length > 0 && <li>Missing required column: {missing.join(', ')}</li>}
                  {unknown.length > 0 && <li>Unknown column: {unknown.join(', ')}</li>}
                </ul>
              )}
              <div className="max-h-64 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Line</TableHead>
                      {header.map((h, i) => (
                        <TableHead key={i}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {body.slice(0, PREVIEW_ROWS).map((r) => (
                      <TableRow key={r.line}>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {r.line}
                        </TableCell>
                        {r.cells.map((c, i) => (
                          <TableCell key={i}>{c}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">What to do with the current rows</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="assay-import-mode"
                  checked={mode === 'replace'}
                  onChange={() => setMode('replace')}
                />
                Replace them
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="assay-import-mode"
                  checked={mode === 'append'}
                  onChange={() => setMode('append')}
                />
                Keep them and add the file&apos;s rows
              </label>
            </div>
          </fieldset>

          {problems && (
            <div className="space-y-1 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-sm font-medium">The file was not imported. Fix these and retry:</p>
              <ul aria-label="Import errors" className="list-disc pl-5 text-sm">
                {problems.formErrors.map((m) => (
                  <li key={m}>{m}</li>
                ))}
                {problems.rows.flatMap((r) =>
                  r.errors.map((m) => <li key={`${r.line}:${m}`}>{`Line ${r.line}: ${m}`}</li>),
                )}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={importCsv.isPending}>
            Cancel
          </Button>
          <Button
            variant={mode === 'replace' ? 'destructive' : 'default'}
            disabled={!ready || importCsv.isPending}
            onClick={submit}
          >
            {mode === 'replace' ? `Replace all samples in ${label}` : `Add rows to ${label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Sample rows of one dataset: inline number edits, delete, import and download. */
function SamplesSection({ dataset }: { dataset: Dataset }) {
  const samples = useAssaySamples(dataset);
  const { updateSample, removeSample } = useAssayMutations(dataset);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState<AssaySample | null>(null);
  const rows = samples.data ?? [];

  const save = (r: AssaySample, field: string, value: number | null) =>
    updateSample.mutateAsync({ id: r.id, patch: { [field]: value } }).then(
      () => toast.success(`${field} of ${r.sample} saved`),
      (err: unknown) => {
        toast.error(assayErrorMessage(err));
        throw err;
      },
    );

  const download = () =>
    downloadText(
      `assay-${dataset}.csv`,
      toCsv(CSV_COLUMNS, rows as unknown as Record<(typeof CSV_COLUMNS)[number], unknown>[]),
    );

  const confirmDelete = () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    removeSample.mutate(target.id, {
      onSuccess: () => toast.success(`${target.sample} deleted`),
      onError: (err) => toast.error(assayErrorMessage(err)),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {samples.data ? `${rows.length} sample${rows.length === 1 ? '' : 's'}` : ' '}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImporting(true)}>
            <Upload aria-hidden="true" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={download} disabled={!rows.length}>
            <Download aria-hidden="true" />
            Download CSV
          </Button>
        </div>
      </div>

      {samples.isError ? (
        <LoadError what="samples" retry={() => void samples.refetch()} />
      ) : !samples.data ? (
        <TableSkeleton label="Loading samples" />
      ) : rows.length === 0 ? (
        <p className="rounded-xl border p-6 text-sm text-muted-foreground">
          No samples in {datasetLabel(dataset)} yet. Import a CSV to add them.
        </p>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sample</TableHead>
                {SAMPLE_COLUMNS.map((c) => (
                  <TableHead key={c.field} className="text-right">
                    {c.label}
                  </TableHead>
                ))}
                <TableHead>Note</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.sample}</TableCell>
                  {SAMPLE_COLUMNS.map((c) => (
                    <TableCell key={c.field} className="p-1">
                      <NumberCell
                        field={c.label}
                        row={r.sample}
                        value={r[c.field]}
                        nullable={c.nullable}
                        max={c.max}
                        onSave={(value) => save(r, c.field, value)}
                      />
                    </TableCell>
                  ))}
                  <TableCell className="max-w-[16rem] text-xs text-muted-foreground">
                    {r.note}
                  </TableCell>
                  <TableCell className="p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      aria-label={`Delete ${r.sample}`}
                      onClick={() => setDeleting(r)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {importing && <ImportDialog dataset={dataset} onClose={() => setImporting(false)} />}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this sample?"
        description={
          deleting
            ? `${deleting.sample} is removed from ${datasetLabel(dataset)} for good. The audit log keeps its values.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

/**
 * Assay data manager (editor+): the reported summary, sample rows per dataset with inline
 * edits, CSV import/export, and the public sample-data switch (admin+).
 */
export default function Assay() {
  const me = useMe();
  const isAdmin = can(me.data?.role, 'settings');
  const [dataset, setDataset] = useState<Dataset>('grab_B_C');

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Assay data</h1>
        <p className="text-muted-foreground">
          Sample results and the per-section summary from the mine scheme&apos;s assay report.
        </p>
        <p className="rounded-lg border border-copper/40 bg-copper/10 px-3 py-2 text-sm font-medium">
          {SOURCE_NOTE}
        </p>
      </header>

      <PublicDetailSwitch isAdmin={isAdmin} />

      <SummarySection dataset={dataset} />

      <section aria-labelledby="assay-samples-title" className="space-y-3">
        <h2 id="assay-samples-title" className="text-lg font-semibold">
          Samples
        </h2>
        <Tabs value={dataset} onValueChange={(v) => setDataset(v as Dataset)}>
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <TabsList aria-label="Dataset" className="h-auto flex-wrap justify-start">
              {DATASETS.map((d) => (
                <TabsTrigger key={d.value} value={d.value}>
                  {d.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
        <SamplesSection key={dataset} dataset={dataset} />
      </section>
    </div>
  );
}
