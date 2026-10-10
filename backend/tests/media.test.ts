import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { storage } from '../src/config/cloudinary.js';
import { Media } from '../src/models/Media.js';
import { sniffMime } from '../src/middlewares/upload.js';
import { fixtures, loginAs } from './helpers.js';

let app: Express;
let cookies: string[];
beforeEach(async () => {
  app = createApp();
  ({ cookies } = await loginAs(app, 'editor'));
  vi.spyOn(storage, 'upload').mockImplementation(async (buf, opts) => ({
    url: `https://res.cloudinary.com/demo/${opts.resourceType}/upload/niraum/${opts.subfolder}/f.bin`,
    publicId: `niraum/${opts.subfolder}/${Math.random().toString(36).slice(2)}`,
    resourceType: opts.resourceType,
    bytes: buf.length,
    ...(opts.resourceType === 'image' ? { width: 1600, height: 900 } : {}),
  }));
  vi.spyOn(storage, 'destroy').mockResolvedValue(undefined);
});

const upload = (file: Buffer, mime: string, alt?: string) => {
  const req = request(app).post('/api/v1/admin/media').set('Cookie', cookies);
  if (alt !== undefined) void req.field('alt', alt);
  return req.attach('file', file, { filename: 'upload.bin', contentType: mime });
};

describe('media library', () => {
  it('uploads an image to niraum/images with alt text and dimensions', async () => {
    const res = await upload(fixtures.png, 'image/png', 'Outcrop with channel samples');
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      type: 'image',
      mime: 'image/png',
      alt: 'Outcrop with channel samples',
      width: 1600,
      resourceType: 'image',
    });
    expect(storage.upload).toHaveBeenCalledWith(expect.any(Buffer), {
      subfolder: 'images',
      resourceType: 'image',
    });
  });

  it('accepts jpg, webp, avif, pdf and mp4 by magic bytes', async () => {
    expect((await upload(fixtures.jpg, 'image/jpeg', 'a')).status).toBe(201);
    expect((await upload(fixtures.webp, 'image/webp', 'b')).status).toBe(201);
    expect((await upload(fixtures.avif, 'image/avif', 'c')).status).toBe(201);
    const pdf = await upload(fixtures.pdf, 'application/pdf');
    expect(pdf.body.data).toMatchObject({ type: 'document', resourceType: 'raw' });
    const mp4 = await upload(fixtures.mp4, 'video/mp4');
    expect(mp4.body.data).toMatchObject({ type: 'video', resourceType: 'video' });
  });

  it('requires alt text for images', async () => {
    const res = await upload(fixtures.png, 'image/png', '  ');
    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors.alt).toBeDefined();
  });

  it('rejects disallowed types and MIME/content mismatches', async () => {
    expect((await upload(fixtures.exe, 'application/octet-stream', 'x')).status).toBe(415);
    expect((await upload(fixtures.exe, 'image/png', 'x')).status).toBe(415);
    expect((await upload(fixtures.pdf, 'image/png', 'x')).status).toBe(415);
    expect((await request(app).post('/api/v1/admin/media').set('Cookie', cookies)).status).toBe(
      400,
    );
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('enforces per-type size limits (images 8 MB, PDF 5 MB)', async () => {
    const bigImage = Buffer.concat([fixtures.png, Buffer.alloc(8 * 1024 * 1024)]);
    const img = await upload(bigImage, 'image/png', 'big');
    expect(img.status).toBe(413);
    const bigPdf = Buffer.concat([fixtures.pdf, Buffer.alloc(5 * 1024 * 1024)]);
    expect((await upload(bigPdf, 'application/pdf')).status).toBe(413);
  });

  it('lists, edits alt text and deletes from Cloudinary too', async () => {
    const created = await upload(fixtures.png, 'image/png', 'Old alt');
    await upload(fixtures.pdf, 'application/pdf');
    const id = created.body.data.id as string;

    const images = await request(app).get('/api/v1/admin/media?type=image').set('Cookie', cookies);
    expect(images.body.meta.total).toBe(1);

    const patched = await request(app)
      .patch(`/api/v1/admin/media/${id}`)
      .set('Cookie', cookies)
      .send({ alt: 'New alt' });
    expect(patched.body.data.alt).toBe('New alt');

    const del = await request(app).delete(`/api/v1/admin/media/${id}`).set('Cookie', cookies);
    expect(del.status).toBe(204);
    expect(storage.destroy).toHaveBeenCalledWith(created.body.data.publicId, 'image');
    expect(await Media.findById(id)).toBeNull();

    expect(
      (await request(app).delete(`/api/v1/admin/media/${id}`).set('Cookie', cookies)).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .patch(`/api/v1/admin/media/${id}`)
          .set('Cookie', cookies)
          .send({ alt: 'x' })
      ).status,
    ).toBe(404);
  });

  it('keeps the record when Cloudinary delete fails', async () => {
    const created = await upload(fixtures.png, 'image/png', 'Keep me');
    vi.mocked(storage.destroy).mockRejectedValue(new Error('cloudinary 500'));
    const del = await request(app)
      .delete(`/api/v1/admin/media/${created.body.data.id as string}`)
      .set('Cookie', cookies);
    expect(del.status).toBe(502);
    expect(await Media.countDocuments()).toBe(1);
  });

  it('reports missing Cloudinary configuration as 503', async () => {
    vi.mocked(storage.upload).mockRestore();
    const res = await upload(fixtures.png, 'image/png', 'no storage');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('STORAGE_UNAVAILABLE');
  });
});

describe('sniffMime', () => {
  it('identifies supported formats and rejects the rest', () => {
    expect(sniffMime(fixtures.png)).toBe('image/png');
    expect(sniffMime(fixtures.jpg)).toBe('image/jpeg');
    expect(sniffMime(fixtures.webp)).toBe('image/webp');
    expect(sniffMime(fixtures.avif)).toBe('image/avif');
    expect(sniffMime(fixtures.mp4)).toBe('video/mp4');
    expect(sniffMime(fixtures.pdf)).toBe('application/pdf');
    expect(sniffMime(fixtures.exe)).toBeNull();
    expect(sniffMime(Buffer.from('tiny'))).toBeNull();
  });
});
