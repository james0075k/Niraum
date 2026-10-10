import { DataOriginNote } from '@/components/sections/DataOriginNote';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useT } from '@/hooks/useLang';
import { formatPct } from '@/lib/format';
import type { AssaySummaryData } from '@/lib/types';

/** Table 14 rebuilt as HTML: length-weighted grade per section + deposit average. */
export function AssaySummaryTable({ data }: { data: AssaySummaryData }) {
  const { t } = useT('technical');
  const cols = ['SiO2', 'Fe', 'Fe2O3', 'Al2O3'] as const;
  const head = { SiO2: 'SiO₂ %', Fe: 'Fe %', Fe2O3: 'Fe₂O₃ %', Al2O3: 'Al₂O₃ %' };

  return (
    <div>
      <div className="glass overflow-x-auto p-2 sm:p-4">
        <Table className="tabular-nums">
          <TableCaption className="sr-only">{t('table.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{t('table.section')}</TableHead>
              <TableHead scope="col" className="text-right">
                {t('table.thickness')}
              </TableHead>
              {cols.map((c) => (
                <TableHead key={c} scope="col" className="text-right">
                  {head[c]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.sections.map((s) => (
              <TableRow key={s.section}>
                <TableHead scope="row" className="font-semibold text-foreground">
                  {s.section}
                </TableHead>
                <TableCell className="text-right">{s.thicknessM.toFixed(2)}</TableCell>
                {cols.map((c) => (
                  <TableCell key={c} className="text-right">
                    {formatPct(s[c])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          {data.overall && (
            <TableFooter>
              <TableRow className="font-bold">
                <TableHead scope="row" className="text-copper-ink">
                  {t('table.overall')}
                </TableHead>
                <TableCell className="text-right">{data.overall.thicknessM.toFixed(2)}</TableCell>
                {cols.map((c) => (
                  <TableCell key={c} className="text-right text-copper-ink">
                    {formatPct(data.overall![c])}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
      <DataOriginNote />
    </div>
  );
}
