import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  appearancePayload,
  appearanceSchema,
  toAppearanceValues,
  type AppearanceValues,
} from '../../settings/schema';
import { useDirtyReport, useResetOnChange } from '../../settings/hooks';
import { SaveBar, TabSection, type TabProps } from '../../settings/shared';

function RadioGroup({
  legend,
  options,
  register,
}: {
  legend: string;
  options: { value: string; label: string; lang?: string }[];
  register: UseFormRegisterReturn;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          >
            <input
              type="radio"
              value={o.value}
              className="accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register}
            />
            <span lang={o.lang} className={o.lang === 'ne' ? 'font-[Mukta]' : undefined}>
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function AppearanceTab({ settings, save, onDirty }: TabProps) {
  const values = useMemo(() => toAppearanceValues(settings), [settings]);
  const form = useForm<AppearanceValues>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: values,
  });
  const { isDirty, isSubmitting } = form.formState;
  useDirtyReport(isDirty, onDirty);
  useResetOnChange(form, values);

  const onSubmit = form.handleSubmit(async (v) => {
    const saved = await save(appearancePayload(v));
    if (saved) form.reset(toAppearanceValues(saved));
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <TabSection
          title="Defaults for visitors"
          description="Used when a visitor has no saved preference of their own."
        >
          <RadioGroup
            legend="Default theme"
            register={form.register('defaultMode')}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
          <RadioGroup
            legend="Default language"
            register={form.register('defaultLanguage')}
            options={[
              { value: 'en', label: 'English' },
              { value: 'ne', label: 'नेपाली', lang: 'ne' },
            ]}
          />
        </TabSection>

        <TabSection title="Assay data">
          <div className="flex items-start gap-3">
            <Controller
              control={form.control}
              name="publicAssayDetail"
              render={({ field }) => (
                <Switch
                  id="public-assay-detail"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-describedby="public-assay-detail-help"
                />
              )}
            />
            <div className="space-y-2">
              <Label htmlFor="public-assay-detail">Show sample-level assay data publicly</Label>
              <p id="public-assay-detail-help" className="text-sm text-muted-foreground">
                Off: the public site shows only the assay summary (averages and highlights). On:
                visitors can also browse every individual sample result. Editors can always see the
                samples here in the admin panel.
              </p>
              <p className="rounded-lg border border-copper/40 bg-copper/10 px-3 py-2 text-sm font-medium">
                [CONFIRM] Client permission to publish sample-level assay data is pending.
              </p>
            </div>
          </div>
        </TabSection>

        <SaveBar label="Save appearance" dirty={isDirty} saving={isSubmitting} />
      </form>
    </Form>
  );
}
