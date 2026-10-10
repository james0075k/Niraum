import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Loader2, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Captcha, captchaEnabled, type CaptchaHandle } from '@/components/common/Captcha';
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
import { Textarea } from '@/components/ui/textarea';
import {
  applicationSchema,
  sendApplication,
  type ApplicationInput,
} from '@/features/contact/schemas';
import { cn } from '@/lib/utils';

/**
 * Job application with CV upload (PDF ≤ 5 MB). Omit `jobSlug` for a general application.
 * `compact` stacks every field in one column (sidebar use).
 */
export function ApplyForm({
  jobSlug,
  compact,
  className,
}: {
  jobSlug?: string;
  compact?: boolean;
  className?: string;
}) {
  const wide = compact ? undefined : 'sm:col-span-2';
  const form = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { name: '', email: '', phone: '', message: '', website: '' },
  });
  const captcha = useRef<CaptchaHandle>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function onSubmit(values: ApplicationInput) {
    try {
      await sendApplication(values, jobSlug, captchaToken);
      toast.success('Application received — thank you.', {
        description: 'We will contact you if your profile matches a role.',
      });
      form.reset();
    } catch {
      toast.error('Your application could not be sent.', { description: 'Please try again.' });
    } finally {
      captcha.current?.reset();
    }
  }

  const submitting = form.formState.isSubmitting;
  const awaitingCaptcha = captchaEnabled && !captchaToken;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        aria-label="Job application form"
        className={cn(
          'glass-strong grid gap-5 p-6 sm:p-8',
          !compact && 'sm:grid-cols-2',
          className,
        )}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name *</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" inputMode="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone *</FormLabel>
              <FormControl>
                <Input type="tel" inputMode="tel" autoComplete="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cv"
          render={({ field: { onChange, value: _value, ...field } }) => (
            <FormItem>
              <FormLabel>CV (PDF) *</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="cursor-pointer pt-2.5 file:mr-3 file:text-copper-ink"
                  onChange={(e) => onChange(e.target.files?.[0])}
                  {...field}
                />
              </FormControl>
              <FormDescription className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" /> PDF only, up to 5 MB.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className={wide}>
              <FormLabel>Cover note</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="apply-website">Website</label>
          <input
            id="apply-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...form.register('website')}
          />
        </div>
        <Captcha ref={captcha} onToken={setCaptchaToken} className={wide} />
        <div className={wide}>
          <Button type="submit" size="lg" disabled={submitting || awaitingCaptcha}>
            {submitting ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Send aria-hidden="true" />
            )}
            {submitting ? 'Sending…' : 'Submit application'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
