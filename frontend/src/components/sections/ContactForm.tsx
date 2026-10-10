import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Captcha, captchaEnabled, type CaptchaHandle } from '@/components/common/Captcha';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  useFormField,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { contactSchema, sendContact, type ContactInput } from '@/features/contact/schemas';
import { useT } from '@/hooks/useLang';
import { cn } from '@/lib/utils';

/** FormMessage that translates the Zod message key (`message.errors.*`). */
function TMessage() {
  const { t } = useT('contact');
  const { error, formMessageId } = useFormField();
  if (!error?.message) return null;
  return (
    <p id={formMessageId} className="text-[0.8rem] font-medium text-destructive">
      {t(error.message)}
    </p>
  );
}

/**
 * Glass contact form (RHF + Zod). `website` is a honeypot hidden from people and
 * assistive tech; the API silently drops submissions that fill it. With a Turnstile site
 * key the form also needs a captcha token.
 */
export function ContactForm({
  defaultSubject = '',
  className,
}: {
  defaultSubject?: string;
  className?: string;
}) {
  const { t } = useT('contact');
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      subject: defaultSubject,
      message: '',
      website: '',
    },
  });
  const captcha = useRef<CaptchaHandle>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function onSubmit(values: ContactInput) {
    try {
      await sendContact(values, captchaToken);
      toast.success(t('message.sent'), { description: t('message.sentBody') });
      form.reset({ ...form.formState.defaultValues, subject: '' });
    } catch {
      toast.error(t('message.failed'), { description: t('message.failedBody') });
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
        aria-label={t('message.aria')}
        className={cn('glass-strong grid gap-5 p-6 sm:grid-cols-2 sm:p-8', className)}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('message.name')} *</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <TMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('message.email')} *</FormLabel>
              <FormControl>
                <Input type="email" inputMode="email" autoComplete="email" {...field} />
              </FormControl>
              <TMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('message.phone')}</FormLabel>
              <FormControl>
                <Input type="tel" inputMode="tel" autoComplete="tel" {...field} />
              </FormControl>
              <TMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('message.company')}</FormLabel>
              <FormControl>
                <Input autoComplete="organization" {...field} />
              </FormControl>
              <TMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>{t('message.subject')} *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <TMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>{t('message.message')} *</FormLabel>
              <FormControl>
                <Textarea rows={6} placeholder={t('message.placeholder')} {...field} />
              </FormControl>
              <TMessage />
            </FormItem>
          )}
        />
        {/* Honeypot — off-screen, not focusable, not announced. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...form.register('website')}
          />
        </div>
        <Captcha ref={captcha} onToken={setCaptchaToken} className="sm:col-span-2" />
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">{t('message.required')}</p>
          <Button type="submit" size="lg" disabled={submitting || awaitingCaptcha}>
            {submitting ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Send aria-hidden="true" />
            )}
            {submitting ? t('message.sending') : t('message.submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
