export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export const directionsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

/** Assay values: always two decimals, Latin digits (data tables use tabular numerals). */
export const formatPct = (n: number | null | undefined) => (n == null ? '—' : n.toFixed(2));
