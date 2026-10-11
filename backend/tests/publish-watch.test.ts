import { vi } from 'vitest';
import { checkScheduled } from '../src/jobs/publishWatch.js';
import { rebuild } from '../src/jobs/rebuild.js';
import { Post } from '../src/models/Post.js';
import { Project } from '../src/models/Project.js';

const minute = 60_000;
const at = (offsetMs: number) => new Date(Date.now() + offsetMs);

describe('scheduled publish watch', () => {
  it('schedules a rebuild when a post or project went live since the last check', async () => {
    const spy = vi.spyOn(rebuild, 'schedule').mockImplementation(() => undefined);
    await Post.create({
      title: { en: 'Due' },
      slug: 'due',
      published: true,
      publishedAt: at(-minute),
    });
    await Project.create({
      title: { en: 'Due site' },
      slug: 'due-site',
      mineral: 'iron-ore',
      published: true,
      publishedAt: at(-2 * minute),
    });

    const count = await checkScheduled(at(-5 * minute), new Date());

    expect(count).toBe(2);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toMatch(/2 scheduled/);
  });

  it('ignores items outside the window, drafts and deleted items', async () => {
    const spy = vi.spyOn(rebuild, 'schedule').mockImplementation(() => undefined);
    await Post.create([
      { title: { en: 'Old' }, slug: 'old', published: true, publishedAt: at(-60 * minute) },
      { title: { en: 'Future' }, slug: 'future', published: true, publishedAt: at(60 * minute) },
      { title: { en: 'Draft' }, slug: 'draft', published: false, publishedAt: at(-minute) },
      {
        title: { en: 'Gone' },
        slug: 'gone',
        published: true,
        publishedAt: at(-minute),
        isDeleted: true,
      },
    ]);

    expect(await checkScheduled(at(-5 * minute), new Date())).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });
});
