import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
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
import {
  BUYER_TYPES,
  QUANTITY_UNITS,
  inquirySchema,
  sendInquiry,
  type BuyerType,
  type InquiryInput,
  type InquiryTopic,
} from '@/features/inquiries/schemas';
import { useLang, useT } from '@/hooks/useLang';
import { cn } from '@/lib/utils';

/** FormMessage that translates the Zod message key (`form.errors.*` in the contact namespace). */
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

const selectCls =
  'flex h-11 w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm';

/**
 * Bulk Supply Inquiry (blueprint §5) — also used for "Request full assay report"
 * (topic technical_report) and "Request investor deck" (topic investor_deck).
 * Sends the page language (auto-reply language) and the source page.
 */
export function InquiryForm({
  topic = 'supply',
  defaultBuyerType,
  className,
}: {
  topic?: InquiryTopic;
  defaultBuyerType?: BuyerType;
  className?: string;
}) {
  const { t } = useT('contact');
  const lang = useLang();
  const { pathname } = useLocation();
  const form = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      buyerType: defaultBuyerType,
      topic,
      quantity: '',
      quantityUnit: '',
      deliveryLocation: '',
      specRequirement: '',
      message: '',
      website: '',
    },
  });
  const captcha = useRef<CaptchaHandle>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function onSubmit(values: InquiryInput) {
    try {
      await sendInquiry(values, { lang, sourcePage: pathname }, captchaToken);
      toast.success(t('form.sent'), { description: t('form.sentBody') });
      form.reset();
    } catch {
      toast.error(t('form.failed'), { description: t('form.failedBody') });
    } finally {
      captcha.current?.reset();
    }
  }

  const submitting = form.formState.isSubmitting;
  const awaitingCaptcha = captchaEnabled && !captchaToken;
  const showQuantity = topic === 'supply' || topic === 'technical_report';

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        aria-label={t('form.aria')}
        className={cn('glass-strong relative grid gap-5 p-6 sm:grid-cols-2 sm:p-8', className)}
      >
        <p className="label text-copper-ink sm:col-span-2">
          {t('form.topicLabel')}: {t(`form.topic.${topic}`)}
        </p>
        {(
          [
            ['companyName', 'form.company', 'organization', 'text'],
            ['contactName', 'form.contact', 'name', 'text'],
            ['email', 'form.email', 'email', 'email'],
            ['phone', 'form.phone', 'tel', 'tel'],
          ] as const
        ).map(([name, label, autoComplete, type]) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t(label)} *</FormLabel>
                <FormControl>
                  <Input type={type} autoComplete={autoComplete} {...field} />
                </FormControl>
                <TMessage />
              </FormItem>
            )}
          />
        ))}
        <FormField
          control={form.control}
          name="buyerType"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>{t('form.buyerType')} *</FormLabel>
              <FormControl>
                <select {...field} value={field.value ?? ''} className={selectCls}>
                  <option value="" disabled>
                    {t('form.choose')}
                  </option>
                  {BUYER_TYPES.map((b) => (
                    <option key={b} value={b}>
                      {t(`form.buyer.${b}`)}
                    </option>
                  ))}
                </select>
              </FormControl>
              <TMessage />
            </FormItem>
          )}
        />
        {showQuantity && (
          <>
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.quantity')}</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" {...field} />
                  </FormControl>
                  <TMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantityUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.unit')}</FormLabel>
                  <FormControl>
                    <select {...field} value={field.value ?? ''} className={selectCls}>
                      <option value="">{t('form.choose')}</option>
                      {QUANTITY_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {t(`form.units.${u}`)}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <TMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deliveryLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.delivery')}</FormLabel>
                  <FormControl>
                    <Input autoComplete="address-level2" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specRequirement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.spec')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>{t('form.message')}</FormLabel>
              <FormControl>
                <Textarea rows={5} placeholder={t('form.messagePlaceholder')} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        {/* Honeypot — off-screen, not focusable, not announced. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor={`inquiry-website-${topic}`}>Website</label>
          <input
            id={`inquiry-website-${topic}`}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...form.register('website')}
          />
        </div>
        <Captcha ref={captcha} onToken={setCaptchaToken} className="sm:col-span-2" />
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">{t('form.required')}</p>
          <Button type="submit" size="lg" disabled={submitting || awaitingCaptcha}>
            {submitting ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Send aria-hidden="true" />
            )}
            {submitting ? t('form.sending') : t('form.submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
