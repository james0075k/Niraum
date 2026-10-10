import { useQuery } from '@tanstack/react-query';
import { assaySamples, assaySummary } from '@/content/katujpani';
import { useSettings } from '@/features/settings/useSettings';
import { api, type ApiList } from '@/lib/api';
import { useContentItem } from '@/lib/query';
import type { AssaySampleRow, AssaySummaryData } from '@/lib/types';

/** Table 14 sections, deposit average and headline figures — numbers never typed in components. */
export function useAssaySummary(): AssaySummaryData {
  const { data } = useContentItem<AssaySummaryData>(
    ['assay', 'summary'],
    '/assay/summary',
    assaySummary,
  );
  return data ?? assaySummary;
}

/**
 * Sample-level rows, only when the admin has made them public (settings.publicAssayDetail).
 * Returns `null` while private, so pages render the "Request full assay report" path instead.
 */
export function useAssaySamples(): AssaySampleRow[] | null {
  const { publicAssayDetail } = useSettings();
  const { data } = useQuery({
    queryKey: ['assay', 'samples'],
    enabled: publicAssayDetail === true,
    queryFn: async () => {
      try {
        return (await api.get<ApiList<AssaySampleRow>>('/assay/samples')).data.data;
      } catch {
        // API down → the same rows from the bundled JSON (flag already says they're public).
        return assaySamples;
      }
    },
    initialData: publicAssayDetail ? assaySamples : undefined,
  });
  return publicAssayDetail ? (data ?? assaySamples) : null;
}
