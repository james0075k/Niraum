import { useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { slugify } from '../resources/slugify';

/**
 * URL slug (`slug` of the surrounding form). Empty on a new document = generated from the
 * title on save. Changing it on a published document breaks links to the old URL.
 */
export function SlugField({ source, isNew }: { source: string; isNew: boolean }) {
  const { register, setValue, getFieldState, formState, control } = useFormContext();
  const title = useWatch({ control, name: source }) as string | undefined;
  const { error } = getFieldState('slug', formState);
  return (
    <div className="space-y-1.5">
      <Label htmlFor="resource-slug">Slug</Label>
      <div className="flex gap-2">
        <Input
          id="resource-slug"
          placeholder={isNew ? 'Generated from the name' : undefined}
          maxLength={80}
          aria-invalid={!!error}
          aria-describedby="resource-slug-help"
          {...register('slug')}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={!title?.trim()}
          onClick={() => setValue('slug', slugify(title ?? ''), { shouldDirty: true })}
        >
          Generate
        </Button>
      </div>
      {error?.message ? (
        <p className="text-xs font-medium text-destructive">{String(error.message)}</p>
      ) : null}
      <p id="resource-slug-help" className="text-xs text-muted-foreground">
        {isNew
          ? 'Leave empty to create it from the English name.'
          : 'Changing the slug changes the page address; old links stop working.'}
      </p>
    </div>
  );
}
