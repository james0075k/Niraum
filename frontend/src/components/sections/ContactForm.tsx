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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { contactSchema, sendContact, type ContactInput } from '@/features/contact/schemas';
import { cn } from '@/lib/utils';

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
      toast.success('Thank you — your message has been sent.', {
        description: 'We reply to most enquiries within two working days.',
      });
      form.reset({ ...form.formState.defaultValues, subject: '' });
    } catch {
      toast.error('Your message could not be sent.', {
        description: 'Please try again in a moment.',
      });
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
        aria-label="Contact form"
        className={cn('glass-strong grid gap-5 p-6 sm:grid-cols-2 sm:p-8', className)}
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
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input type="tel" inputMode="tel" autoComplete="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input autoComplete="organization" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Subject *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Message *</FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  placeholder="Material, quantity, delivery location and timing help us reply faster."
                  {...field}
                />
              </FormControl>
              <FormMessage />
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
          <p className="text-xs text-muted-foreground">
            * Required. We use your details only to reply — see our Privacy Policy.
          </p>
          <Button type="submit" size="lg" disabled={submitting || awaitingCaptcha}>
            {submitting ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Send aria-hidden="true" />
            )}
            {submitting ? 'Sending…' : 'Send message'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
