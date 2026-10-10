import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let timer: NodeJS.Timeout | null = null;
const reasons = new Set<string>();

async function fire(): Promise<void> {
  const url = env.REBUILD_HOOK_URL;
  const why = [...reasons];
  reasons.clear();
  timer = null;
  if (!url) return;
  try {
    // Vercel / Netlify deploy hooks accept an empty POST.
    const res = await fetch(url, { method: 'POST', signal: AbortSignal.timeout(10_000) });
    logger.info({ status: res.status, reasons: why }, 'Frontend rebuild triggered');
  } catch (err) {
    logger.error({ err }, 'Frontend rebuild hook failed');
  }
}

/**
 * Debounced call to the static host's deploy hook (REBUILD_HOOK_URL) so prerendered pages
 * pick up published content. Many edits within REBUILD_DEBOUNCE_SECONDS → one rebuild.
 */
export const rebuild = {
  schedule(reason: string): void {
    if (!env.REBUILD_HOOK_URL) return;
    reasons.add(reason);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void fire(), env.REBUILD_DEBOUNCE_SECONDS * 1000);
    timer.unref();
  },

  /** Immediate rebuild (admin "Publish site now" button). */
  async now(reason = 'manual'): Promise<boolean> {
    if (!env.REBUILD_HOOK_URL) return false;
    if (timer) clearTimeout(timer);
    reasons.add(reason);
    await fire();
    return true;
  },

  pending: (): boolean => timer !== null,
};
