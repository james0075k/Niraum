import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LocalizedField } from '../../components/LocalizedField';
import {
  companyPayload,
  companySchema,
  toCompanyValues,
  type CompanyValues,
} from '../../settings/schema';
import { useDirtyReport, useResetOnChange } from '../../settings/hooks';
import { SaveBar, TabSection, type TabProps } from '../../settings/shared';

export default function CompanyTab({ settings, save, onDirty }: TabProps) {
  const values = useMemo(() => toCompanyValues(settings), [settings]);
  const form = useForm<CompanyValues>({
    resolver: zodResolver(companySchema),
    defaultValues: values,
  });
  // Reading dirtyFields subscribes to it (needed for the localized payload).
  const { isDirty, isSubmitting, dirtyFields } = form.formState;
  useDirtyReport(isDirty, onDirty);
  useResetOnChange(form, values);

  const onSubmit = form.handleSubmit(async (v) => {
    const saved = await save(companyPayload(v, dirtyFields));
    if (saved) form.reset(toCompanyValues(saved));
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <TabSection
          title="Company"
          description="Names and motto shown in the header, footer and search results."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name</FormLabel>
                  <FormControl>
                    <Input maxLength={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="legalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Legal name</FormLabel>
                  <FormControl>
                    <Input maxLength={150} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <LocalizedField name="motto" label="Motto" as="input" max={150} required />
        </TabSection>

        <TabSection
          title="Logo"
          description="An https:// image URL or a site path such as /logo.svg. Leave empty to use the built-in logo."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {(['light', 'dark'] as const).map((mode) => (
              <FormField
                key={mode}
                control={form.control}
                name={`logo.${mode}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{mode === 'light' ? 'Logo (light)' : 'Logo (dark)'}</FormLabel>
                    <FormControl>
                      <Input inputMode="url" placeholder="/logo.svg" {...field} />
                    </FormControl>
                    <FormDescription>
                      {mode === 'light'
                        ? 'Used on light backgrounds.'
                        : 'Used on dark backgrounds.'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </TabSection>

        <SaveBar label="Save company" dirty={isDirty} saving={isSubmitting} />
      </form>
    </Form>
  );
}
