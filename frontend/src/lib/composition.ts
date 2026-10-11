import type { AssaySection } from '@/lib/types';

export type CompositionKey = 'sio2' | 'fe2o3' | 'al2o3' | 'other';
export interface CompositionSlice {
  key: CompositionKey;
  value: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Deposit weighted average (assay Table 14) as donut slices, largest first. Table 14 reports
 * SiO₂, Fe₂O₃ and Al₂O₃; the rest of each sample (LOI, CaO, MgO… — not broken out there) is
 * one "other" slice. Fe is never a slice: it is the iron contained in Fe₂O₃.
 */
export function compositionSlices(o: AssaySection): CompositionSlice[] {
  const oxides: CompositionSlice[] = [
    { key: 'sio2', value: o.SiO2 },
    { key: 'fe2o3', value: o.Fe2O3 },
    { key: 'al2o3', value: o.Al2O3 },
  ];
  const other = round2(100 - oxides.reduce((n, s) => n + s.value, 0));
  const slices = other > 0 ? [...oxides, { key: 'other' as const, value: other }] : oxides;
  return slices.sort((a, b) => b.value - a.value);
}
