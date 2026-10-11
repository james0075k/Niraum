/** Display labels for inquiry enums (backend/src/models/Inquiry.ts). */
export const BUYER_LABEL: Record<string, string> = {
  cement: 'Cement plant',
  steel_foundry: 'Steel or foundry',
  trader: 'Mineral trader',
  investor: 'Investor',
  other: 'Other',
};

export const TOPIC_LABEL: Record<string, string> = {
  supply: 'Bulk supply',
  technical_report: 'Full assay report',
  investor_deck: 'Investor deck',
};

export const LANG_LABEL: Record<string, string> = { en: 'English', ne: 'नेपाली (Nepali)' };

/** `500 t/month`, `1200 t (one-off)` or an em dash. */
export function formatQuantity(quantity: unknown, unit: unknown): string {
  if (typeof quantity !== 'number') return '—';
  const n = quantity.toLocaleString('en-GB');
  if (unit === 'tpm') return `${n} t/month`;
  if (unit === 'one_off_t') return `${n} t (one-off)`;
  return n;
}

/** `tel:` href: keeps a leading + and digits only. */
export const telHref = (phone: string) => `tel:${phone.replace(/(?!^\+)[^\d]/g, '')}`;
