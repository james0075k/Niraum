import nodemailer, { type Transporter } from 'nodemailer';
import { env } from './env.js';
import { logger } from './logger.js';

export interface MailMessage {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

let transport: Transporter | null = null;
function smtp(): Transporter {
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST ?? 'localhost',
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS ?? '' } } : {}),
  });
  return transport;
}

async function sendViaResend(msg: MailMessage, apiKey: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: Array.isArray(msg.to) ? msg.to : [msg.to],
      ...(msg.cc && { cc: Array.isArray(msg.cc) ? msg.cc : [msg.cc] }),
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
      reply_to: msg.replyTo,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}`);
}

/**
 * Outbound email. An object (not bare functions) so tests can `vi.spyOn(mailer, 'send')`.
 * Resend is used when RESEND_API_KEY is set, otherwise SMTP (Mailpit in development).
 */
export const mailer = {
  async send(msg: MailMessage): Promise<void> {
    if (env.RESEND_API_KEY) {
      await sendViaResend(msg, env.RESEND_API_KEY);
    } else {
      await smtp().sendMail({ from: env.MAIL_FROM, ...msg });
    }
  },

  /** Fire-and-forget: failures are logged, never surfaced to the visitor. */
  sendInBackground(msg: MailMessage): void {
    mailer.send(msg).catch((err: unknown) => {
      logger.error({ err, subject: msg.subject }, 'Email delivery failed');
    });
  },
};
