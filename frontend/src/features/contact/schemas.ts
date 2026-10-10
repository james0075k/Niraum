import { z } from 'zod';
import { api } from '@/lib/api';

/** Contact form — mirrors backend validator (Phase 4). `website` is the honeypot. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, 'message.errors.name').max(100),
  email: z.string().trim().email('message.errors.email'),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+\d\s()-]*$/, 'message.errors.phoneChars')
    .optional()
    .or(z.literal('')),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  subject: z.string().trim().min(3, 'message.errors.subject').max(150),
  message: z.string().trim().min(10, 'message.errors.message').max(5000),
  website: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

/** `captchaToken` comes from the Turnstile widget; it is only sent when a site key is set. */
export const sendContact = (input: ContactInput, captchaToken?: string | null) =>
  api.post('/contact', captchaToken ? { ...input, captchaToken } : input);

export const CV_MAX_BYTES = 5 * 1024 * 1024;

export const applicationSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(100),
  email: z.string().trim().email('Please enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .min(7, 'Please enter a phone number.')
    .max(30)
    .regex(/^[+\d\s()-]*$/, 'Use digits, spaces and + ( ) - only.'),
  message: z.string().trim().max(3000).optional().or(z.literal('')),
  cv: z
    .custom<File>((f) => typeof File !== 'undefined' && f instanceof File, 'Please attach your CV.')
    .refine((f) => f.type === 'application/pdf', 'CV must be a PDF.')
    .refine((f) => f.size <= CV_MAX_BYTES, 'CV must be 5 MB or smaller.'),
  website: z.string().max(0).optional(),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

export function sendApplication(
  input: ApplicationInput,
  jobSlug?: string,
  captchaToken?: string | null,
) {
  const fd = new FormData();
  fd.append('name', input.name);
  fd.append('email', input.email);
  fd.append('phone', input.phone);
  fd.append('message', input.message ?? '');
  fd.append('website', input.website ?? '');
  if (jobSlug) fd.append('job', jobSlug);
  if (captchaToken) fd.append('captchaToken', captchaToken);
  fd.append('cv', input.cv);
  return api.post('/applications', fd);
}

export const newsletterSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
});
export const subscribeNewsletter = (email: string) => api.post('/newsletter', { email });
