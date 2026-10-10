import multer from 'multer';
import type { RequestHandler } from 'express';
import type { MediaType } from '../models/Media.js';
import type { ResourceType } from '../config/cloudinary.js';
import { AppError } from '../utils/AppError.js';

const MB = 1024 * 1024;

export type AllowedMime =
  'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | 'application/pdf' | 'video/mp4';

interface FileRule {
  type: MediaType;
  resourceType: ResourceType;
  maxBytes: number;
}

/** Per-type limits: images 8 MB, PDF 5 MB, video 50 MB. */
export const FILE_RULES: Record<AllowedMime, FileRule> = {
  'image/jpeg': { type: 'image', resourceType: 'image', maxBytes: 8 * MB },
  'image/png': { type: 'image', resourceType: 'image', maxBytes: 8 * MB },
  'image/webp': { type: 'image', resourceType: 'image', maxBytes: 8 * MB },
  'image/avif': { type: 'image', resourceType: 'image', maxBytes: 8 * MB },
  'application/pdf': { type: 'document', resourceType: 'raw', maxBytes: 5 * MB },
  'video/mp4': { type: 'video', resourceType: 'video', maxBytes: 50 * MB },
};

const ascii = (buf: Buffer, start: number, end: number) =>
  buf.subarray(start, end).toString('latin1');

/** Identifies a file from its first bytes — the client-declared MIME is never trusted alone. */
export function sniffMime(buf: Buffer): AllowedMime | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (ascii(buf, 0, 4) === 'RIFF' && ascii(buf, 8, 12) === 'WEBP') return 'image/webp';
  if (ascii(buf, 0, 5) === '%PDF-') return 'application/pdf';
  if (ascii(buf, 4, 8) === 'ftyp') {
    const brand = ascii(buf, 8, 12);
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
    if (['isom', 'iso2', 'mp41', 'mp42', 'avc1', 'M4V ', 'dash'].includes(brand)) {
      return 'video/mp4';
    }
  }
  return null;
}

/**
 * Validates an uploaded file: allowed list, declared MIME must match the magic bytes,
 * per-type size limit. Returns the rule for the detected type.
 */
export function checkFile(
  file: Express.Multer.File | undefined,
  allowed: readonly AllowedMime[],
): { file: Express.Multer.File; mime: AllowedMime; rule: FileRule } {
  if (!file) throw AppError.badRequest('A file is required');
  const sniffed = sniffMime(file.buffer);
  if (!sniffed || !allowed.includes(sniffed) || sniffed !== file.mimetype) {
    throw new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'File type is not allowed', {
      allowed,
    });
  }
  const rule = FILE_RULES[sniffed];
  if (file.size > rule.maxBytes) {
    throw new AppError(413, 'PAYLOAD_TOO_LARGE', `File exceeds ${rule.maxBytes / MB} MB limit`);
  }
  return { file, mime: sniffed, rule };
}

/** Memory storage (files never touch the API disk). Hard cap = largest per-type limit. */
export function uploadSingle(field: string, maxBytes = 50 * MB): RequestHandler {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1, fields: 20 },
  }).single(field);
}
