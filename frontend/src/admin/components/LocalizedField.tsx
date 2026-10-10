import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Lang = 'en' | 'ne';

const LANG_NAME: Record<Lang, string> = { en: 'English', ne: 'Nepali' };

/**
 * A localized text field: English | नेपाली tabs over `${name}.en` / `${name}.ne` of the
 * surrounding react-hook-form. English is the required one; the नेपाली tab shows a dot while
 * the Nepali value is empty (the site falls back to English). `richtext` is a plain textarea
 * until the rich-text editor lands.
 */
export function LocalizedField(props: {
  name: string;
  label: string;
  as: 'input' | 'textarea' | 'richtext';
  max?: number;
  required?: boolean;
}): JSX.Element {
  const { name, label, as, max, required } = props;
  const { register, control, getFieldState, formState } = useFormContext();
  const [tab, setTab] = useState<Lang>('en');
  const values = useWatch({ control, name: [`${name}.en`, `${name}.ne`] }) as [
    string | undefined,
    string | undefined,
  ];
  const neMissing = !values[1]?.trim();

  const field = (lang: Lang) => {
    const path = `${name}.${lang}`;
    const value = (lang === 'en' ? values[0] : values[1]) ?? '';
    const { error } = getFieldState(path, formState);
    const id = `${name.replace(/\W/g, '-')}-${lang}`;
    const common = {
      id,
      'aria-label': `${label} (${LANG_NAME[lang]})`,
      'aria-invalid': !!error,
      'aria-describedby': error ? `${id}-error` : undefined,
      lang,
      maxLength: max,
      className: cn(lang === 'ne' && 'font-[Mukta]'),
      ...register(path),
    };
    return (
      <div className="space-y-1">
        {as === 'input' ? (
          <Input {...common} />
        ) : (
          <Textarea rows={as === 'richtext' ? 8 : 4} {...common} />
        )}
        <div className="flex items-start justify-between gap-2 text-xs">
          <span id={`${id}-error`} className="font-medium text-destructive">
            {error?.message ? String(error.message) : ''}
          </span>
          {max !== undefined && (
            <span className="tabular-nums text-muted-foreground">
              {value.length} / {max}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium leading-none">
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </p>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Lang)}>
        <TabsList aria-label={`${label} language`}>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="ne" className="gap-1.5">
            <span lang="ne" className="font-[Mukta]">
              नेपाली
            </span>
            {neMissing && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-copper" aria-hidden="true" />
                <span className="sr-only">Nepali missing</span>
              </>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="en">{field('en')}</TabsContent>
        <TabsContent value="ne">
          {field('ne')}
          <p className="mt-1 text-xs text-muted-foreground">
            Optional. When empty, the Nepali site shows the English text.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
