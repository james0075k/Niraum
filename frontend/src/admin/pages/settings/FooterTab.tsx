import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocalizedField } from '../../components/LocalizedField';
import {
  footerPayload,
  footerSchema,
  toFooterValues,
  type FooterValues,
} from '../../settings/schema';
import { useDirtyReport, useResetOnChange } from '../../settings/hooks';
import { SaveBar, TabSection, type TabProps } from '../../settings/shared';

const MAX_LINKS = 20;

export default function FooterTab({ settings, save, onDirty }: TabProps) {
  const values = useMemo(() => toFooterValues(settings), [settings]);
  const form = useForm<FooterValues>({
    resolver: zodResolver(footerSchema),
    defaultValues: values,
  });
  // Reading dirtyFields subscribes to it (needed for the localized payload).
  const { isDirty, isSubmitting, errors, dirtyFields } = form.formState;
  useDirtyReport(isDirty, onDirty);
  useResetOnChange(form, values);
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: 'links' });

  const onSubmit = form.handleSubmit(async (v) => {
    const saved = await save(footerPayload(v, dirtyFields));
    if (saved) form.reset(toFooterValues(saved));
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <TabSection title="Footer">
          <LocalizedField name="about" label="About text" as="textarea" max={600} required />
        </TabSection>
        <TabSection
          title="Footer links"
          description="Extra links under the footer navigation. Use https:// for other sites or a /path for pages on this site."
        >
          {fields.length === 0 && <p className="text-sm text-muted-foreground">No links yet.</p>}
          <ol className="space-y-3">
            {fields.map((f, i) => {
              const err = errors.links?.[i];
              return (
                <li
                  key={f.id}
                  className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                >
                  <div className="space-y-1">
                    <Label htmlFor={`footer-${i}-label`}>{`Link label ${i + 1}`}</Label>
                    <Input
                      id={`footer-${i}-label`}
                      maxLength={60}
                      aria-invalid={!!err?.label}
                      {...form.register(`links.${i}.label`)}
                    />
                    {err?.label && (
                      <p className="text-xs font-medium text-destructive">{err.label.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`footer-${i}-href`}>{`Link URL ${i + 1}`}</Label>
                    <Input
                      id={`footer-${i}-href`}
                      inputMode="url"
                      placeholder="/contact"
                      aria-invalid={!!err?.href}
                      {...form.register(`links.${i}.href`)}
                    />
                    {err?.href && (
                      <p className="text-xs font-medium text-destructive">{err.href.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Move link ${i + 1} up`}
                      disabled={i === 0}
                      onClick={() => move(i, i - 1)}
                    >
                      <ArrowUp aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Move link ${i + 1} down`}
                      disabled={i === fields.length - 1}
                      onClick={() => move(i, i + 1)}
                    >
                      <ArrowDown aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove link ${i + 1}`}
                      onClick={() => remove(i)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={fields.length >= MAX_LINKS}
            onClick={() => append({ label: '', href: '' })}
          >
            <Plus className="mr-1" aria-hidden="true" />
            Add link
          </Button>
        </TabSection>
        <SaveBar label="Save footer" dirty={isDirty} saving={isSubmitting} />
      </form>
    </Form>
  );
}
