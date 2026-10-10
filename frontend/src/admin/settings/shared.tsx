import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { AdminSettings } from './schema';

/** What the Settings page hands each tab. */
export interface TabProps {
  settings: AdminSettings;
  /** PUTs a partial body; toasts success/warnings/errors. Resolves with the saved settings or null. */
  save(body: Record<string, unknown>): Promise<AdminSettings | null>;
  /** Reports the tab's dirty state so the page can run one unsaved-changes guard. */
  onDirty(dirty: boolean): void;
}

export function TabSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </header>
      {children}
    </section>
  );
}

/** Sticky footer with the tab's Save button (disabled until something changed). */
export function SaveBar({
  label,
  dirty,
  saving,
  extra,
}: {
  label: string;
  dirty: boolean;
  saving: boolean;
  extra?: ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-end gap-2 border-t bg-background/95 px-1 py-3 backdrop-blur">
      {dirty && <span className="mr-auto text-sm text-muted-foreground">Unsaved changes</span>}
      {extra}
      <Button type="submit" disabled={!dirty || saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        {label}
      </Button>
    </div>
  );
}
