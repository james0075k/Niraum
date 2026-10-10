import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useMemo, useState, type KeyboardEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { SeoPreview } from '../../components/SeoPreview';
import { seoPayload, seoSchema, toSeoValues, type SeoValues } from '../../settings/schema';
import { useDirtyReport, useResetOnChange } from '../../settings/hooks';
import { SaveBar, TabSection, type TabProps } from '../../settings/shared';

const Counter = ({ value, max }: { value: string; max: number }) => (
  <span
    className={`text-xs tabular-nums ${value.length > max ? 'text-destructive' : 'text-muted-foreground'}`}
  >
    {value.length} / {max}
  </span>
);

export default function SeoTab({ settings, save, onDirty }: TabProps) {
  const values = useMemo(() => toSeoValues(settings), [settings]);
  const form = useForm<SeoValues>({
    resolver: zodResolver(seoSchema),
    defaultValues: values,
  });
  const { isDirty, isSubmitting, errors } = form.formState;
  useDirtyReport(isDirty, onDirty);
  useResetOnChange(form, values);
  const [title, description, keywords] = useWatch({
    control: form.control,
    name: ['defaultTitle', 'defaultDescription', 'keywords'],
  });
  const [draft, setDraft] = useState('');

  const setKeywords = (next: string[]) =>
    form.setValue('keywords', next, { shouldDirty: true, shouldValidate: true });

  function addKeyword() {
    const k = draft.trim().slice(0, 50);
    if (k && !keywords.some((x) => x.toLowerCase() === k.toLowerCase()) && keywords.length < 30) {
      setKeywords([...keywords, k]);
    }
    setDraft('');
  }

  function onKeywordKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword();
    } else if (e.key === 'Backspace' && draft === '' && keywords.length) {
      setKeywords(keywords.slice(0, -1));
    }
  }

  const onSubmit = form.handleSubmit(async (v) => {
    const saved = await save(seoPayload(v));
    if (saved) form.reset(toSeoValues(saved));
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <TabSection
          title="Search engines"
          description="Defaults for pages that don't set their own title and description."
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="defaultTitle"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Default title</FormLabel>
                      <Counter value={title ?? ''} max={70} />
                    </div>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultDescription"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Default description</FormLabel>
                      <Counter value={description ?? ''} max={170} />
                    </div>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ogImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social share image</FormLabel>
                    <FormControl>
                      <Input inputMode="url" placeholder="/og-image.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      An https:// URL or a site path. 1200 × 630 px works best.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label htmlFor="seo-keyword">Add keyword</Label>
                <ul className="flex flex-wrap gap-2" aria-label="Keywords">
                  {keywords.map((k) => (
                    <li
                      key={k}
                      className="inline-flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-sm"
                    >
                      {k}
                      <button
                        type="button"
                        className="rounded-full p-0.5 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Remove keyword ${k}`}
                        onClick={() => setKeywords(keywords.filter((x) => x !== k))}
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
                <Input
                  id="seo-keyword"
                  value={draft}
                  maxLength={50}
                  placeholder="Type a keyword and press Enter"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeywordKey}
                  onBlur={addKeyword}
                />
                {errors.keywords && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.keywords.message ?? 'Check the keywords'}
                  </p>
                )}
              </div>
            </div>
            <SeoPreview title={title ?? ''} description={description ?? ''} />
          </div>
        </TabSection>
        <SaveBar label="Save SEO" dirty={isDirty} saving={isSubmitting} />
      </form>
    </Form>
  );
}
