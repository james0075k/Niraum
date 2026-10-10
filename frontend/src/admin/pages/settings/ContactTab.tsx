import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import {
  useFieldArray,
  useForm,
  useFormState,
  type Control,
  type UseFormRegister,
} from 'react-hook-form';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import {
  contactPayload,
  contactSchema,
  toContactValues,
  type ContactValues,
} from '../../settings/schema';
import { useDirtyReport, useResetOnChange } from '../../settings/hooks';
import { SaveBar, TabSection, type TabProps } from '../../settings/shared';

const MAX_ROWS = 5;

/** Up to five phone numbers or emails, one per row. */
function ListEditor({
  name,
  label,
  type,
  control,
  register,
}: {
  name: 'phones' | 'emails';
  label: string;
  type: 'tel' | 'email';
  control: Control<ContactValues>;
  register: UseFormRegister<ContactValues>;
}) {
  const { fields, append, remove } = useFieldArray({ control, name });
  const { errors } = useFormState({ control, name });
  const list = errors[name];
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      {fields.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
      {fields.map((f, i) => {
        const id = `${name}-${i}`;
        const error = list?.[i]?.value?.message;
        return (
          <div key={f.id} className="space-y-1">
            <div className="flex gap-2">
              <Label htmlFor={id} className="sr-only">
                {`${label} ${i + 1}`}
              </Label>
              <Input
                id={id}
                type={type}
                aria-invalid={!!error}
                autoComplete="off"
                {...register(`${name}.${i}.value`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
                onClick={() => remove(i)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            {error && <p className="text-xs font-medium text-destructive">{error}</p>}
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={fields.length >= MAX_ROWS}
        onClick={() => append({ value: '' })}
      >
        <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
        {`Add ${type === 'tel' ? 'phone' : 'email'}`}
      </Button>
    </fieldset>
  );
}

export default function ContactTab({ settings, save, onDirty }: TabProps) {
  const values = useMemo(() => toContactValues(settings), [settings]);
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: values,
  });
  const { isDirty, isSubmitting } = form.formState;
  useDirtyReport(isDirty, onDirty);
  useResetOnChange(form, values);

  const onSubmit = form.handleSubmit(async (v) => {
    const saved = await save(contactPayload(v));
    if (saved) form.reset(toContactValues(saved));
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <TabSection title="Contact" description="Shown on the contact page and in the footer.">
          <div className="grid gap-6 sm:grid-cols-2">
            <ListEditor
              name="phones"
              label="Phone numbers"
              type="tel"
              control={form.control}
              register={form.register}
            />
            <ListEditor
              name="emails"
              label="Emails"
              type="email"
              control={form.control}
              register={form.register}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input type="tel" maxLength={30} placeholder="+977 …" {...field} />
                  </FormControl>
                  <FormDescription>Optional. Include the country code.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="officeHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Office hours</FormLabel>
                  <FormControl>
                    <Input maxLength={200} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </TabSection>
        <SaveBar label="Save contact" dirty={isDirty} saving={isSubmitting} />
      </form>
    </Form>
  );
}
