import { ArrowDownWideNarrow } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataOriginNote } from '@/components/sections/DataOriginNote';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useT } from '@/hooks/useLang';
import { formatPct } from '@/lib/format';
import type { AssayDataset, AssaySampleRow } from '@/lib/types';

const DATASETS: AssayDataset[] = ['grab_B_C', 'grab_A', 'channel_B', 'channel_C', 'channel_KXY'];

/** Sample-level rows (shown only when settings.publicAssayDetail is on): filter + sort by Fe. */
export function AssaySampleTable({ rows }: { rows: AssaySampleRow[] }) {
  const { t } = useT('technical');
  const [dataset, setDataset] = useState<AssayDataset | 'all'>('all');
  const [byFe, setByFe] = useState(false);

  const shown = useMemo(() => {
    const filtered = dataset === 'all' ? rows : rows.filter((r) => r.dataset === dataset);
    return byFe ? [...filtered].sort((a, b) => b.Fe - a.Fe) : filtered;
  }, [rows, dataset, byFe]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm font-medium">
          {t('samples.filter')}
          <select
            value={dataset}
            onChange={(e) => setDataset(e.target.value as AssayDataset | 'all')}
            className="h-11 rounded-lg border border-input bg-background/60 px-3 text-base md:text-sm"
          >
            <option value="all">{t('samples.all')}</option>
            {DATASETS.map((d) => (
              <option key={d} value={d}>
                {t(`samples.datasets.${d}`)}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          variant="outline"
          aria-pressed={byFe}
          onClick={() => setByFe((v) => !v)}
          className="h-11"
        >
          <ArrowDownWideNarrow aria-hidden="true" /> {t('samples.sortFe')}
        </Button>
        <p className="ml-auto text-sm text-muted-foreground" aria-live="polite">
          {t('samples.count', { count: shown.length })}
        </p>
      </div>
      <div className="glass max-h-[32rem] overflow-auto p-2 sm:p-4">
        <Table className="tabular-nums">
          <TableCaption className="sr-only">{t('samples.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{t('samples.sample')}</TableHead>
              <TableHead scope="col">{t('samples.dataset')}</TableHead>
              <TableHead scope="col" className="text-right">
                SiO₂ %
              </TableHead>
              <TableHead scope="col" className="text-right">
                Fe %
              </TableHead>
              <TableHead scope="col" className="text-right">
                Fe₂O₃ %
              </TableHead>
              <TableHead scope="col" className="text-right">
                Al₂O₃ %
              </TableHead>
              <TableHead scope="col" className="text-right">
                {t('samples.length')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((r) => (
              <TableRow key={`${r.dataset}-${r.sample}`}>
                <TableHead scope="row" className="font-semibold text-foreground">
                  {r.sample}
                  {r.note && (
                    <span className="ml-1 text-copper-ink" title={r.note}>
                      *
                    </span>
                  )}
                </TableHead>
                <TableCell className="text-muted-foreground">
                  {t(`samples.datasets.${r.dataset}`)}
                </TableCell>
                <TableCell className="text-right">{formatPct(r.SiO2)}</TableCell>
                <TableCell className="text-right">{formatPct(r.Fe)}</TableCell>
                <TableCell className="text-right">{formatPct(r.Fe2O3)}</TableCell>
                <TableCell className="text-right">{formatPct(r.Al2O3)}</TableCell>
                <TableCell className="text-right">
                  {r.lengthM == null ? '—' : r.lengthM.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataOriginNote />
    </div>
  );
}
