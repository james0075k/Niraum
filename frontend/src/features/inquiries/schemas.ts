import { z } from 'zod';
import { api } from '@/lib/api';

/** Bulk Supply Inquiry (blueprint §5 Contact) — mirrors backend/src/validators/public.ts. */
export const BUYER_TYPES = ['cement', 'steel_foundry', 'trader', 'investor', 'other'] as const;
export const QUANTITY_UNITS = ['tpm', 'one_off_t'] as const;
export const INQUIRY_TOPICS = ['supply', 'technical_report', 'investor_deck'] as const;
export type InquiryTopic = (typeof INQUIRY_TOPICS)[number];
export type BuyerType = (typeof BUYER_TYPES)[number];

/** Messages are translation keys in the `contact` namespace (`form.errors.*`). */
export const inquirySchema = z
  .object({
    companyName: z.string().trim().min(2, 'form.errors.company').max(150),
    contactName: z.string().trim().min(2, 'form.errors.name').max(100),
    email: z.string().trim().email('form.errors.email'),
    phone: z
      .string()
      .trim()
      .min(7, 'form.errors.phone')
      .max(30)
      .regex(/^[+\d\s()-]*$/, 'form.errors.phoneChars'),
    buyerType: z.enum(BUYER_TYPES, { errorMap: () => ({ message: 'form.errors.buyerType' }) }),
    topic: z.enum(INQUIRY_TOPICS),
    quantity: z
      .string()
      .trim()
      .regex(/^(\d+(\.\d+)?)?$/, 'form.errors.quantity')
      .optional()
      .or(z.literal('')),
    quantityUnit: z.enum(QUANTITY_UNITS).optional().or(z.literal('')),
    deliveryLocation: z.string().trim().max(200).optional().or(z.literal('')),
    specRequirement: z.string().trim().max(500).optional().or(z.literal('')),
    message: z.string().trim().max(5000).optional().or(z.literal('')),
    website: z.string().max(0).optional(),
  })
  .refine((v) => !v.quantity || !!v.quantityUnit, {
    message: 'form.errors.unit',
    path: ['quantityUnit'],
  });
export type InquiryInput = z.infer<typeof inquirySchema>;

/** Sends the inquiry with the page language (auto-reply language) and source page. */
export function sendInquiry(
  input: InquiryInput,
  meta: { lang: string; sourcePage: string },
  captchaToken?: string | null,
) {
  const { quantity, quantityUnit, ...rest } = input;
  return api.post('/inquiries', {
    ...rest,
    ...(quantity ? { quantity: Number(quantity), quantityUnit } : {}),
    lang: meta.lang,
    sourcePage: meta.sourcePage,
    ...(captchaToken ? { captchaToken } : {}),
  });
}
