import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Post } from '../models/Post.js';
import { Project } from '../models/Project.js';
import { rebuild } from './rebuild.js';

/**
 * Count projects and posts whose scheduled `publishedAt` fell in (since, now] and schedule a site
 * rebuild if any did. Saving a scheduled item rebuilds too early, so this catches the moment it
 * actually goes live.
 */
export async function checkScheduled(since: Date, now: Date): Promise<number> {
  const filter = {
    published: true,
    isDeleted: false,
    publishedAt: { $gt: since, $lte: now },
  };
  const [projects, posts] = await Promise.all([
    Project.countDocuments(filter),
    Post.countDocuments(filter),
  ]);
  const count = projects + posts;
  if (count > 0) rebuild.schedule(`${count} scheduled item(s) went live`);
  return count;
}

/**
 * Check every PUBLISH_CHECK_MINUTES. Single API instance only (like the rate limits). The first
 * window reaches one interval back, so items that went live during a restart are not missed.
 */
export function startPublishWatch(): () => void {
  if (!env.REBUILD_HOOK_URL || env.PUBLISH_CHECK_MINUTES === 0) return () => undefined;
  const intervalMs = env.PUBLISH_CHECK_MINUTES * 60_000;
  let since = new Date(Date.now() - intervalMs);
  const timer = setInterval(() => {
    const now = new Date();
    checkScheduled(since, now).then(
      () => {
        since = now;
      },
      (err: unknown) => logger.error({ err }, 'Scheduled publish check failed'),
    );
  }, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
