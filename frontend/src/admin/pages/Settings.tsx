import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, type ApiErrorBody } from '@/lib/api';
import { useUnsavedGuard } from '../hooks/useUnsavedGuard';
import {
  SETTINGS_KEY,
  WARNING_TEXT,
  type AdminSettings,
  type SettingsWarning,
} from '../settings/schema';
import type { TabProps } from '../settings/shared';
import AddressMapTab from './settings/AddressMapTab';
import AppearanceTab from './settings/AppearanceTab';
import CompanyTab from './settings/CompanyTab';
import ContactTab from './settings/ContactTab';
import FooterTab from './settings/FooterTab';
import SeoTab from './settings/SeoTab';
import SocialTab from './settings/SocialTab';

const TABS = [
  { value: 'company', label: 'Company', Tab: CompanyTab },
  { value: 'contact', label: 'Contact', Tab: ContactTab },
  { value: 'address', label: 'Address & Map', Tab: AddressMapTab },
  { value: 'social', label: 'Social', Tab: SocialTab },
  { value: 'seo', label: 'SEO', Tab: SeoTab },
  { value: 'footer', label: 'Footer', Tab: FooterTab },
  { value: 'appearance', label: 'Appearance', Tab: AppearanceTab },
] as const satisfies readonly {
  value: string;
  label: string;
  Tab: ComponentType<TabProps>;
}[];

type TabKey = (typeof TABS)[number]['value'];

const isTab = (v: string | null): v is TabKey => TABS.some((t) => t.value === v);

function saveErrorMessage(err: unknown): string {
  if (isAxiosError<ApiErrorBody>(err) && err.response) {
    const { status, data } = err.response;
    if (status === 403) return "Your role can't change settings.";
    if (status === 400 || status === 422)
      return data?.error?.message ?? 'Check the highlighted fields.';
  }
  return "Couldn't save the settings. Please try again.";
}

function showWarnings(warnings: SettingsWarning[] | undefined) {
  for (const w of warnings ?? []) {
    if (w.code === 'GEOCODE_APPROXIMATE') toast.info(WARNING_TEXT.GEOCODE_APPROXIMATE);
    else if (w.code === 'GEOCODE_FAILED') toast.warning(WARNING_TEXT.GEOCODE_FAILED);
    else toast.warning(w.message);
  }
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading settings" role="status">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

/**
 * Site settings in tabs (`?tab=` deep-links). Each tab is its own form and its Save sends only
 * that tab's sections; one unsaved-changes guard covers all tabs. Admin+ (RequireRole).
 */
export default function Settings() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => (await api.get<{ data: AdminSettings }>('/admin/settings')).data.data,
  });

  const [params, setParams] = useSearchParams();
  const urlTab = params.get('tab');
  const [tab, setTab] = useState<TabKey>(isTab(urlTab) ? urlTab : 'company');
  // Tabs stay mounted once opened, so switching keeps unsaved input.
  const [opened, setOpened] = useState<ReadonlySet<TabKey>>(() => new Set([tab]));
  const [dirty, setDirty] = useState<Partial<Record<TabKey, boolean>>>({});
  const anyDirty = Object.values(dirty).some(Boolean);
  useUnsavedGuard(anyDirty);

  const selectTab = (next: string) => {
    if (!isTab(next)) return;
    setTab(next);
    setOpened((prev) => (prev.has(next) ? prev : new Set(prev).add(next)));
  };

  // Links (command palette, other pages) can change ?tab= while the page is open.
  const [seenUrlTab, setSeenUrlTab] = useState(urlTab);
  if (urlTab !== seenUrlTab) {
    setSeenUrlTab(urlTab);
    if (isTab(urlTab) && urlTab !== tab) selectTab(urlTab);
  }

  // Mirror the tab into the URL — but not while something is unsaved, since the
  // unsaved-changes guard treats a URL change as leaving the page.
  useEffect(() => {
    if (anyDirty || (urlTab ?? 'company') === tab) return;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      },
      { replace: true },
    );
  }, [anyDirty, tab, urlTab, setParams]);

  const reporters = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((t) => [
          t.value,
          (d: boolean) =>
            setDirty((prev) => (!!prev[t.value] === d ? prev : { ...prev, [t.value]: d })),
        ]),
      ) as Record<TabKey, (d: boolean) => void>,
    [],
  );

  const save = useCallback(
    async (body: Record<string, unknown>): Promise<AdminSettings | null> => {
      try {
        const res = await api.put<{ data: AdminSettings; meta?: { warnings?: SettingsWarning[] } }>(
          '/admin/settings',
          body,
        );
        const saved = res.data.data;
        qc.setQueryData(SETTINGS_KEY, saved);
        toast.success('Settings saved');
        showWarnings(res.data.meta?.warnings);
        return saved;
      } catch (err) {
        toast.error(saveErrorMessage(err));
        return null;
      }
    },
    [qc],
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">
          Company details, contact, map, social links and site-wide defaults.
        </p>
      </header>

      {query.isError ? (
        <div role="alert" className="space-y-3 rounded-xl border p-6">
          <p>Couldn&apos;t load the settings.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      ) : !query.data ? (
        <SettingsSkeleton />
      ) : (
        <Tabs value={tab} onValueChange={selectTab}>
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <TabsList aria-label="Settings sections" className="h-auto flex-wrap justify-start">
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                  {t.label}
                  {dirty[t.value] && (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-copper" aria-hidden="true" />
                      <span className="sr-only">(unsaved)</span>
                    </>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {TABS.map(({ value, Tab }) =>
            opened.has(value) ? (
              <TabsContent
                key={value}
                value={value}
                forceMount
                hidden={tab !== value}
                className="mt-4"
              >
                <Tab settings={query.data} save={save} onDirty={reporters[value]} />
              </TabsContent>
            ) : null,
          )}
        </Tabs>
      )}
    </div>
  );
}
