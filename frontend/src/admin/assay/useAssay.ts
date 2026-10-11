import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api, type ApiErrorBody, type ApiItem } from '@/lib/api';
import { SETTINGS_KEY } from '../settings/schema';

/** Datasets of backend `ASSAY_DATASETS` (models/AssaySample.ts), in the same order. */
export const DATASETS = [
  { value: 'grab_B_C', label: 'Grab — areas B & C' },
  { value: 'grab_A', label: 'Grab — area A quarry' },
  { value: 'channel_B', label: 'Channel — section B' },
  { value: 'channel_C', label: 'Channel — section C' },
  { value: 'channel_KXY', label: 'Channel — K, X, Y' },
] as const;
export type Dataset = (typeof DATASETS)[number]['value'];

export const datasetLabel = (d: Dataset) => DATASETS.find((x) => x.value === d)?.label ?? d;

/** `/admin/assay/samples` row (weight %; channel samples carry their length in metres). */
export interface AssaySample {
  id: string;
  sample: string;
  dataset: Dataset;
  SiO2: number;
  LOI: number | null;
  Fe: number;
  Fe2O3: number;
  Al2O3: number;
  CaO: number | null;
  MgO: number | null;
  lengthM: number | null;
  note: string;
  order: number;
}

/** `/admin/assay/summary` row: Table 14 section or the deposit-wide average. */
export interface AssaySummaryRow {
  id: string;
  section: string;
  thicknessM: number;
  SiO2: number;
  Fe: number;
  Fe2O3: number;
  Al2O3: number;
  isOverall: boolean;
  order: number;
}

/** CSV columns of `POST /admin/assay/import` (backend validators/assay.ts CSV_COLUMNS). */
export const CSV_COLUMNS = [
  'sample',
  'SiO2',
  'LOI',
  'Fe',
  'Fe2O3',
  'Al2O3',
  'CaO',
  'MgO',
  'lengthM',
  'note',
] as const;
export const CSV_REQUIRED = ['sample', 'SiO2', 'Fe', 'Fe2O3', 'Al2O3'] as const;

export type SampleNumberField =
  'SiO2' | 'LOI' | 'Fe' | 'Fe2O3' | 'Al2O3' | 'CaO' | 'MgO' | 'lengthM';
export type SummaryNumberField = 'thicknessM' | 'SiO2' | 'Fe' | 'Fe2O3' | 'Al2O3';

/** Sample table columns: label, whether blank (null) is allowed, and the upper bound. */
export const SAMPLE_COLUMNS: {
  field: SampleNumberField;
  label: string;
  nullable: boolean;
  max?: number;
}[] = [
  { field: 'SiO2', label: 'SiO2', nullable: false, max: 100 },
  { field: 'LOI', label: 'LOI', nullable: true, max: 100 },
  { field: 'Fe', label: 'Fe', nullable: false, max: 100 },
  { field: 'Fe2O3', label: 'Fe2O3', nullable: false, max: 100 },
  { field: 'Al2O3', label: 'Al2O3', nullable: false, max: 100 },
  { field: 'CaO', label: 'CaO', nullable: true, max: 100 },
  { field: 'MgO', label: 'MgO', nullable: true, max: 100 },
  { field: 'lengthM', label: 'lengthM', nullable: true },
];

export const SUMMARY_COLUMNS: { field: SummaryNumberField; label: string; max?: number }[] = [
  { field: 'thicknessM', label: 'thicknessM' },
  { field: 'SiO2', label: 'SiO2', max: 100 },
  { field: 'Fe', label: 'Fe', max: 100 },
  { field: 'Fe2O3', label: 'Fe2O3', max: 100 },
  { field: 'Al2O3', label: 'Al2O3', max: 100 },
];

export interface ImportRowError {
  line: number;
  errors: string[];
}
export interface ImportProblems {
  formErrors: string[];
  rows: ImportRowError[];
}

const KEY = ['admin', 'assay'] as const;
const samplesKey = (dataset: Dataset) => [...KEY, 'samples', dataset] as const;
const SUMMARY_KEY = [...KEY, 'summary'] as const;
const PUBLIC_KEY = [...KEY, 'public-detail'] as const;

export function useAssaySamples(dataset: Dataset) {
  return useQuery({
    queryKey: samplesKey(dataset),
    queryFn: async () =>
      (
        await api.get<{ data: AssaySample[] }>('/admin/assay/samples', {
          params: { dataset },
        })
      ).data.data,
  });
}

export function useAssaySummary() {
  return useQuery({
    queryKey: SUMMARY_KEY,
    queryFn: async () =>
      (await api.get<ApiItem<AssaySummaryRow[]>>('/admin/assay/summary')).data.data,
  });
}

/**
 * Whether sample rows are public. Admins read `/admin/settings` (never cached); editors can't,
 * so they read the public settings, which carry the same flag.
 */
export function usePublicAssayDetail(isAdmin: boolean) {
  return useQuery({
    queryKey: isAdmin ? SETTINGS_KEY : PUBLIC_KEY,
    queryFn: async () =>
      (
        await api.get<ApiItem<{ publicAssayDetail?: boolean }>>(
          isAdmin ? '/admin/settings' : '/settings/public',
        )
      ).data.data,
    select: (s) => s.publicAssayDetail === true,
  });
}

export function useAssayMutations(dataset: Dataset) {
  const qc = useQueryClient();
  const refreshSamples = () => qc.invalidateQueries({ queryKey: [...KEY, 'samples'] });

  const updateSample = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<AssaySample> }) =>
      (await api.put<ApiItem<AssaySample>>(`/admin/assay/samples/${id}`, patch)).data.data,
    onSuccess: (saved) => {
      qc.setQueryData<AssaySample[]>(samplesKey(saved.dataset ?? dataset), (rows) =>
        rows?.map((r) => (r.id === saved.id ? { ...r, ...saved } : r)),
      );
      void refreshSamples();
    },
  });

  const removeSample = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/assay/samples/${id}`);
    },
    onSuccess: () => void refreshSamples(),
  });

  const updateSummary = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<AssaySummaryRow> }) =>
      (await api.put<ApiItem<AssaySummaryRow>>(`/admin/assay/summary/${id}`, patch)).data.data,
    onSuccess: (saved) => {
      qc.setQueryData<AssaySummaryRow[]>(SUMMARY_KEY, (rows) =>
        rows?.map((r) => (r.id === saved.id ? { ...r, ...saved } : r)),
      );
    },
  });

  const importCsv = useMutation({
    mutationFn: async ({ text, mode }: { text: string; mode: 'replace' | 'append' }) =>
      (
        await api.post<ApiItem<{ inserted: number; replaced: number }>>(
          '/admin/assay/import',
          text,
          { params: { dataset, mode }, headers: { 'Content-Type': 'text/csv' } },
        )
      ).data.data,
    onSuccess: () => void refreshSamples(),
  });

  const setPublicDetail = useMutation({
    mutationFn: async (on: boolean) =>
      (
        await api.put<ApiItem<{ publicAssayDetail?: boolean }>>('/admin/settings', {
          publicAssayDetail: on,
        })
      ).data.data,
    onSuccess: (saved) => {
      // Keep the rest of the cached settings (the Settings page shares this key).
      qc.setQueryData<Record<string, unknown>>(SETTINGS_KEY, (prev) => ({ ...prev, ...saved }));
    },
  });

  return { updateSample, removeSample, updateSummary, importCsv, setPublicDetail };
}

/** `details` of an import 400, or null for any other failure. */
export function importProblems(err: unknown): ImportProblems | null {
  if (!isAxiosError<ApiErrorBody>(err) || err.response?.status !== 400) return null;
  const details = err.response.data?.error?.details as Partial<ImportProblems> | undefined;
  const formErrors = Array.isArray(details?.formErrors) ? details.formErrors : [];
  const rows = Array.isArray(details?.rows) ? details.rows : [];
  if (!formErrors.length && !rows.length) {
    return { formErrors: [err.response.data?.error?.message ?? 'The file was rejected.'], rows };
  }
  return { formErrors, rows };
}

/** User-facing message for a failed assay write. */
export function assayErrorMessage(err: unknown): string {
  if (isAxiosError<ApiErrorBody>(err) && err.response) {
    const { status, data } = err.response;
    if (status === 403) return "Your role can't change assay data.";
    if (status === 409) return 'A sample with that name already exists in this dataset.';
    if (status === 413) return 'The file is too large (1 MB at most).';
    if (status === 400) return data?.error?.message ?? 'Check the value and try again.';
  }
  return "Couldn't save. Please try again.";
}
