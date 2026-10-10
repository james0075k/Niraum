import { storage } from '../config/cloudinary.js';
import { logger } from '../config/logger.js';
import { Media, type MediaType } from '../models/Media.js';
import { checkFile, type AllowedMime } from '../middlewares/upload.js';
import { AppError } from '../utils/AppError.js';
import { listMeta } from '../utils/pagination.js';
import { auditService, type Actor } from './audit.service.js';

export const MEDIA_MIMES: readonly AllowedMime[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'application/pdf',
  'video/mp4',
];

const SUBFOLDER: Record<MediaType, string> = {
  image: 'images',
  video: 'videos',
  document: 'documents',
};

export const mediaService = {
  async upload(upload: Express.Multer.File | undefined, alt: string, actor: Actor) {
    const { file, mime, rule } = checkFile(upload, MEDIA_MIMES);
    if (rule.type === 'image' && !alt.trim()) {
      throw AppError.badRequest('Alt text is required for images', {
        fieldErrors: { alt: ['Describe the image for screen readers'] },
      });
    }
    const stored = await storage.upload(file.buffer, {
      subfolder: SUBFOLDER[rule.type],
      resourceType: rule.resourceType,
    });
    const media = await Media.create({
      url: stored.url,
      publicId: stored.publicId,
      resourceType: stored.resourceType,
      type: rule.type,
      mime,
      alt: alt.trim(),
      size: stored.bytes || file.size,
      width: stored.width,
      height: stored.height,
      uploadedBy: actor.userId ?? undefined,
    });
    await auditService.record(actor, {
      action: 'upload',
      entity: 'Media',
      entityId: String(media._id),
      diff: { publicId: stored.publicId, type: rule.type },
    });
    return media.toJSON();
  },

  async list(query: { page: number; limit: number; type?: MediaType | undefined }) {
    const filter = query.type ? { type: query.type } : {};
    const [docs, total] = await Promise.all([
      Media.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      Media.countDocuments(filter),
    ]);
    return { data: docs.map((d) => d.toJSON()), meta: listMeta(query.page, query.limit, total) };
  },

  async updateAlt(id: string, alt: string, actor: Actor) {
    const media = await Media.findById(id);
    if (!media) throw AppError.notFound('Media');
    const from = media.alt;
    media.alt = alt;
    await media.save();
    await auditService.record(actor, {
      action: 'update',
      entity: 'Media',
      entityId: id,
      diff: { alt: { from, to: alt } },
    });
    return media.toJSON();
  },

  /** Removes the Cloudinary asset first; the record is only deleted once that succeeded. */
  async remove(id: string, actor: Actor) {
    const media = await Media.findById(id);
    if (!media) throw AppError.notFound('Media');
    try {
      await storage.destroy(media.publicId, media.resourceType);
    } catch (err) {
      logger.error({ err, publicId: media.publicId }, 'Cloudinary delete failed');
      throw new AppError(502, 'STORAGE_ERROR', 'Could not delete the file from media storage');
    }
    await media.deleteOne();
    await auditService.record(actor, {
      action: 'delete',
      entity: 'Media',
      entityId: id,
      diff: { publicId: media.publicId },
    });
  },
};
