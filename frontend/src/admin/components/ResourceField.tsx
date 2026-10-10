import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { FieldDef } from '../resources/config';
import { emptyItem, itemFieldsOf } from '../resources/form';
import { LocalizedField } from './LocalizedField';

const LOCALIZED_AS = { text: 'input', textarea: 'textarea', richtext: 'richtext' } as const;

function Help({ text }: { text?: string }) {
  return text ? <p className="text-xs text-muted-foreground">{text}</p> : null;
}

/** Error message of an array field itself (e.g. "Up to 12 sizes"). */
function ArrayError({ name }: { name: string }) {
  const { getFieldState, formState } = useFormContext();
  const { error } = getFieldState(name, formState);
  const message =
    error?.message ?? (error as { root?: { message?: string } } | undefined)?.root?.message;
  return message ? <p className="text-xs font-medium text-destructive">{String(message)}</p> : null;
}

/** `list` / `pairs` / `images`: rows with add, remove and reorder. */
function ArrayField({ def, name }: { def: FieldDef; name: string }) {
  const { control } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const items = def.kind === 'images' ? IMAGE_ITEM : itemFieldsOf(def);
  const full = def.maxItems !== undefined && fields.length >= def.maxItems;
  const inline = def.kind === 'pairs' || !items;

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{def.label}</legend>
      <Help text={def.help} />
      {fields.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
      <ol className="space-y-3">
        {fields.map((row, i) => (
          <li
            key={row.id}
            className={cn(
              'flex gap-2',
              inline ? 'items-start' : 'flex-col rounded-lg border p-3 sm:flex-row',
            )}
          >
            <div
              className={cn(
                'min-w-0 flex-1',
                inline && items
                  ? 'grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]'
                  : 'space-y-3',
              )}
            >
              {items ? (
                items.map((item) => (
                  <ResourceField
                    key={item.name}
                    def={{ ...item, label: `${item.label} ${i + 1}` }}
                    name={`${name}.${i}.${item.name}`}
                  />
                ))
              ) : (
                <ResourceField
                  def={{
                    name: 'value',
                    label: `${def.label} ${i + 1}`,
                    kind: 'text',
                    max: def.max,
                  }}
                  name={`${name}.${i}.value`}
                />
              )}
            </div>
            <div className="flex shrink-0 gap-1 self-start">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label={`Move ${def.label} ${i + 1} up`}
                disabled={i === 0}
                onClick={() => move(i, i - 1)}
              >
                <ArrowUp aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label={`Move ${def.label} ${i + 1} down`}
                disabled={i === fields.length - 1}
                onClick={() => move(i, i + 1)}
              >
                <ArrowDown aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label={`Remove ${def.label} ${i + 1}`}
                onClick={() => remove(i)}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <ArrayError name={name} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={full}
        onClick={() => append(def.kind === 'images' ? { src: '', alt: '' } : emptyItem(def))}
      >
        <Plus aria-hidden="true" />
        Add {def.label.toLowerCase()}
        {def.maxItems !== undefined && (
          <span className="tabular-nums text-muted-foreground">
            ({fields.length}/{def.maxItems})
          </span>
        )}
      </Button>
    </fieldset>
  );
}

const IMAGE_ITEM: FieldDef[] = [
  { name: 'src', label: 'Image URL', kind: 'text', max: 1000 },
  { name: 'alt', label: 'Alt text', kind: 'text', max: 200 },
];

/** Single image: URL + alt text with a small preview. */
function ImageField({ def, name }: { def: FieldDef; name: string }) {
  const { control } = useFormContext();
  const src = useWatch({ control, name: `${name}.src` }) as string | undefined;
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{def.label}</legend>
      <Help text={def.help ?? 'An https:// image URL or a site path. Leave empty for no image.'} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1 space-y-3">
          <ResourceField
            def={{ name: 'src', label: `${def.label} URL`, kind: 'text', max: 1000 }}
            name={`${name}.src`}
          />
          <ResourceField
            def={{ name: 'alt', label: `${def.label} alt text`, kind: 'text', max: 200 }}
            name={`${name}.alt`}
          />
        </div>
        {src && (/^https:\/\//.test(src) || src.startsWith('/')) ? (
          <img
            src={src}
            alt=""
            className="h-24 w-32 shrink-0 rounded-md border object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
    </fieldset>
  );
}

/** One form control for a FieldDef at `name` (a react-hook-form path). */
export function ResourceField({ def, name }: { def: FieldDef; name: string }) {
  const { control } = useFormContext();

  if (def.kind === 'list' || def.kind === 'pairs' || def.kind === 'images') {
    return <ArrayField def={def} name={name} />;
  }
  if (def.kind === 'image') return <ImageField def={def} name={name} />;

  if (
    def.localized &&
    (def.kind === 'text' || def.kind === 'textarea' || def.kind === 'richtext')
  ) {
    return (
      <div className="space-y-1">
        <LocalizedField
          name={name}
          label={def.label}
          as={LOCALIZED_AS[def.kind]}
          max={def.max}
          required={def.required}
        />
        <Help text={def.help} />
      </div>
    );
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(def.kind === 'switch' && 'flex flex-row items-center gap-3 space-y-0')}
        >
          <FormLabel>
            {def.label}
            {def.required && (
              <span className="text-destructive" aria-hidden="true">
                {' '}
                *
              </span>
            )}
          </FormLabel>
          {def.kind === 'switch' ? (
            <FormControl>
              <Switch checked={!!field.value} onCheckedChange={field.onChange} />
            </FormControl>
          ) : def.kind === 'select' ? (
            <Select value={(field.value as string) ?? ''} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {def.options?.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <FormControl>
              {def.kind === 'textarea' || def.kind === 'richtext' ? (
                <Textarea
                  rows={def.kind === 'richtext' ? 8 : 4}
                  maxLength={def.max}
                  {...field}
                  value={(field.value as string) ?? ''}
                />
              ) : def.kind === 'number' ? (
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={
                    field.value === undefined || Number.isNaN(field.value)
                      ? ''
                      : String(field.value)
                  }
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)
                  }
                  className="tabular-nums"
                />
              ) : (
                <Input
                  type={def.kind === 'date' ? 'date' : 'text'}
                  maxLength={def.max}
                  {...field}
                  value={(field.value as string) ?? ''}
                />
              )}
            </FormControl>
          )}
          {def.help && <FormDescription>{def.help}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
