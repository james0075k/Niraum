import { randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import { mailer } from '../config/mailer.js';
import { Subscriber } from '../models/Subscriber.js';
import { sha256 } from './auth.service.js';

const CONFIRM_TTL_MS = 7 * 24 * 60 * 60_000;
const apiUrl = (path: string) => `${env.API_PUBLIC_URL.replace(/\/$/, '')}/api/v1${path}`;
const siteUrl = (query: string) => `${env.CLIENT_URL.replace(/\/$/, '')}/?newsletter=${query}`;

export const newsletterService = {
  /**
   * Double opt-in. The response never reveals whether the address was already subscribed.
   * Pending (or unsubscribed) addresses get a fresh confirmation link.
   */
  async subscribe(email: string, source = 'website'): Promise<void> {
    const existing = await Subscriber.findOne({ email });
    if (existing?.status === 'subscribed') return;

    const token = randomBytes(32).toString('hex');
    await Subscriber.updateOne(
      { email },
      {
        $set: {
          status: 'pending',
          tokenHash: sha256(token),
          tokenExpires: new Date(Date.now() + CONFIRM_TTL_MS),
          source,
        },
      },
      { upsert: true },
    );
    const link = apiUrl(`/newsletter/confirm?token=${token}`);
    mailer.sendInBackground({
      to: email,
      subject: 'Confirm your subscription — Niraum Metals',
      text:
        `Please confirm you want Niraum Metals news by opening this link:\n\n${link}\n\n` +
        `If you didn't sign up, ignore this email and you won't hear from us.\n`,
    });
  },

  /** Returns the URL to redirect the visitor to. */
  async confirm(token: string): Promise<string> {
    const sub = await Subscriber.findOne({
      tokenHash: sha256(token),
      status: 'pending',
      tokenExpires: { $gt: new Date() },
    });
    if (!sub) return siteUrl('invalid');
    // Rotate the token: the new one only serves the unsubscribe link.
    const unsubscribeToken = randomBytes(32).toString('hex');
    sub.status = 'subscribed';
    sub.confirmedAt = new Date();
    sub.tokenHash = sha256(unsubscribeToken);
    sub.tokenExpires = null;
    await sub.save();
    mailer.sendInBackground({
      to: sub.email,
      subject: 'You are subscribed — Niraum Metals',
      text:
        `Thanks for subscribing to Niraum Metals news.\n\n` +
        `Unsubscribe at any time: ${apiUrl(`/newsletter/unsubscribe?token=${unsubscribeToken}`)}\n`,
    });
    return siteUrl('confirmed');
  },

  async unsubscribe(token: string): Promise<string> {
    const res = await Subscriber.updateOne(
      { tokenHash: sha256(token), status: 'subscribed' },
      { $set: { status: 'unsubscribed' } },
    );
    return siteUrl(res.modifiedCount ? 'unsubscribed' : 'invalid');
  },
};
