import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  PLATFORM_LABELS,
  SOCIAL_PLATFORMS,
  socialPayload,
  socialSchema,
  toSocialValues,
  type SocialValues,
} from '../../settings/schema';
import { useDirtyReport, useResetOnChange } from '../../settings/hooks';
import { SaveBar, TabSection, type TabProps } from '../../settings/shared';

const MAX_LINKS = 16;

const selectClass =
  'flex h-11 w-full rounded-lg border border-input bg-background/60 px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm';

export default function SocialTab({ settings, save, onDirty }: TabProps) {
  const values = useMemo(() => toSocialValues(settings), [settings]);
  const form = useForm<SocialValues>({
    resolver: zodResolver(socialSchema),
    defaultValues: values,
  });
  const { isDirty, isSubmitting, errors } = form.formState;
  useDirtyReport(isDirty, onDirty);
  useResetOnChange(form, values);
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: 'social' });
  const rows = useWatch({ control: form.control, name: 'social' });

  const onSubmit = form.handleSubmit(async (v) => {
    const saved = await save(socialPayload(v));
    if (saved) form.reset(toSocialValues(saved));
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <TabSection
          title="Social links"
          description="Active links appear in the footer and contact page in this order. Turn a link off to hide it without deleting it."
        >
          {fields.length === 0 && <p className="text-sm text-muted-foreground">No links yet.</p>}
          <ol className="space-y-3">
            {fields.map((f, i) => {
              const platform = rows?.[i]?.platform ?? f.platform;
              const name = PLATFORM_LABELS[platform];
              const urlError = errors.social?.[i]?.url?.message;
              return (
                <li
                  key={f.id}
                  className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[10rem_1fr_auto_auto] sm:items-end"
                >
                  <div className="space-y-1">
                    <Label htmlFor={`social-${i}-platform`}>Platform</Label>
                    <select
                      id={`social-${i}-platform`}
                      className={selectClass}
                      {...form.register(`social.${i}.platform`)}
                    >
                      {SOCIAL_PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {PLATFORM_LABELS[p]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`social-${i}-url`}>{`${name} URL`}</Label>
                    <Input
                      id={`social-${i}-url`}
                      type="url"
                      inputMode="url"
                      placeholder="https://"
                      aria-invalid={!!urlError}
                      {...form.register(`social.${i}.url`)}
                    />
                    {urlError && <p className="text-xs font-medium text-destructive">{urlError}</p>}
                  </div>
                  <div className="flex h-11 items-center gap-2">
                    <Controller
                      control={form.control}
                      name={`social.${i}.isActive`}
                      render={({ field }) => (
                        <Switch
                          id={`social-${i}-active`}
                          aria-label={`${name} active`}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <span className="text-sm text-muted-foreground" aria-hidden="true">
                      {rows?.[i]?.isActive ? 'Shown' : 'Hidden'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Move ${name} up`}
                      disabled={i === 0}
                      onClick={() => move(i, i - 1)}
                    >
                      <ArrowUp aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Move ${name} down`}
                      disabled={i === fields.length - 1}
                      onClick={() => move(i, i + 1)}
                    >
                      <ArrowDown aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${name}`}
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
            onClick={() => append({ platform: 'facebook', url: '', isActive: true })}
          >
            <Plus className="mr-1" aria-hidden="true" />
            Add social link
          </Button>
        </TabSection>
        <SaveBar label="Save social links" dirty={isDirty} saving={isSubmitting} />
      </form>
    </Form>
  );
}
