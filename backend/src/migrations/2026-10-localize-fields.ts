/**
 * Phase 4.5 migration — idempotent. Turns plain-string text fields into LocalizedString
 * `{ en: <old value> }` and drops the old text indexes on the plain fields (only one text
 * index is allowed per collection; Mongoose builds the new `<field>.en/.ne` ones on start).
 *
 * Run: `pnpm --filter backend migrate` (also runs at the start of `pnpm seed`).
 */
import type { Model } from 'mongoose';
import { Job } from '../models/Job.js';
import { Post } from '../models/Post.js';
import { Project } from '../models/Project.js';
import { Service } from '../models/Service.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { TeamMember } from '../models/TeamMember.js';

export const MIGRATION_ID = '2026-10-localize-fields';

const targets: { model: Model<never>; fields: string[] }[] = [
  { model: Project as unknown as Model<never>, fields: ['title', 'summary', 'body'] },
  { model: Post as unknown as Model<never>, fields: ['title', 'excerpt', 'body'] },
  { model: Job as unknown as Model<never>, fields: ['title', 'description'] },
  { model: Service as unknown as Model<never>, fields: ['title', 'summary', 'body'] },
  { model: TeamMember as unknown as Model<never>, fields: ['role', 'bio'] },
  { model: SiteSettings as unknown as Model<never>, fields: ['motto', 'footer.about'] },
];

export interface MigrationReport {
  /** `<collection>.<field>` → documents converted in this run. */
  converted: Record<string, number>;
  droppedIndexes: string[];
}

export async function localizeFields(): Promise<MigrationReport> {
  const report: MigrationReport = { converted: {}, droppedIndexes: [] };

  for (const { model, fields } of targets) {
    const coll = model.collection;
    for (const field of fields) {
      // Pipeline update so the old value can be read: { field: { en: "$field" } }.
      const res = await coll.updateMany({ [field]: { $type: 'string' } }, [
        { $set: { [field]: { en: `$${field}` } } },
      ]);
      report.converted[`${coll.collectionName}.${field}`] = res.modifiedCount;
    }

    // Old text indexes cover the plain fields (`title`), not `title.en` — drop them.
    const indexes = await coll.indexes().catch(() => []);
    for (const ix of indexes) {
      const weights = (ix as { weights?: Record<string, number> }).weights;
      if (!weights || !ix.name) continue;
      if (Object.keys(weights).some((k) => fields.includes(k))) {
        await coll.dropIndex(ix.name);
        report.droppedIndexes.push(`${coll.collectionName}.${ix.name}`);
      }
    }
  }

  // Recreate the current indexes (incl. the localized text indexes).
  await Promise.all(targets.map(({ model }) => model.createIndexes()));
  return report;
}
