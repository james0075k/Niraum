import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { env } from './env.js';
import { AppError } from '../utils/AppError.js';

export type ResourceType = 'image' | 'video' | 'raw';

export interface StoredFile {
  url: string;
  publicId: string;
  resourceType: ResourceType;
  bytes: number;
  width?: number;
  height?: number;
}

let configured = false;
function client() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError(503, 'STORAGE_UNAVAILABLE', 'Media storage is not configured');
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

/**
 * Cloudinary wrapper. An object so tests can `vi.spyOn(storage, 'upload')` — no network in CI.
 * Everything lands under CLOUDINARY_FOLDER (default `niraum/`).
 */
export const storage = {
  upload(
    buffer: Buffer,
    opts: { subfolder: string; resourceType: ResourceType; private?: boolean },
  ): Promise<StoredFile> {
    const c = client();
    return new Promise((resolve, reject) => {
      const stream = c.uploader.upload_stream(
        {
          folder: `${env.CLOUDINARY_FOLDER}/${opts.subfolder}`,
          resource_type: opts.resourceType,
          type: opts.private ? 'authenticated' : 'upload',
          use_filename: false,
          unique_filename: true,
        },
        (err, result?: UploadApiResponse) => {
          if (err || !result) {
            reject(new AppError(502, 'STORAGE_ERROR', 'Upload to media storage failed'));
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: opts.resourceType,
            bytes: result.bytes,
            ...(result.width ? { width: result.width } : {}),
            ...(result.height ? { height: result.height } : {}),
          });
        },
      );
      stream.end(buffer);
    });
  },

  async destroy(publicId: string, resourceType: ResourceType, isPrivate = false): Promise<void> {
    await client().uploader.destroy(publicId, {
      resource_type: resourceType,
      type: isPrivate ? 'authenticated' : 'upload',
      invalidate: true,
    });
  },

  /** Short-lived signed URL for private files (CVs). */
  signedUrl(publicId: string, resourceType: ResourceType): string {
    return client().url(publicId, {
      resource_type: resourceType,
      type: 'authenticated',
      sign_url: true,
      secure: true,
    });
  },
};
