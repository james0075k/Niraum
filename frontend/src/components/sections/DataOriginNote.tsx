import { Info } from 'lucide-react';
import { useT } from '@/hooks/useLang';
import { cn } from '@/lib/utils';

/**
 * Mandatory under every technical table (blueprint §4): who sampled and reported the data,
 * and that it is not a JORC/NI 43-101 reserve statement. Kept in English on /ne pages
 * (precise wording) until a reviewed translation exists.
 */
export function DataOriginNote({ className }: { className?: string }) {
  const { t } = useT();
  return (
    <p
      className={cn('mt-4 flex gap-2 text-xs leading-relaxed text-muted-foreground', className)}
      data-testid="data-origin"
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper-ink" aria-hidden="true" />
      <span>{t('dataOrigin')}</span>
    </p>
  );
}
