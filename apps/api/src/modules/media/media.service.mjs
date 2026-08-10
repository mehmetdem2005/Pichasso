import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

function safeExtension(filename) {
  const ext = extname(filename || '').toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext) ? ext : '';
}

export class MediaService {
  constructor({ client, bucket }) {
    this.client = client;
    this.bucket = bucket;
  }

  async createSignedUpload({ projectId, moduleId = null, filename, mimeType }) {
    if (!projectId) throw new TypeError('projectId is required');
    if (!filename || typeof filename !== 'string') throw new TypeError('filename is required');
    if (!ALLOWED_MIME_TYPES.has(mimeType)) throw new TypeError('Unsupported image type');

    const extension = safeExtension(filename);
    const scope = moduleId ? `modules/${moduleId}` : 'unassigned';
    const path = `projects/${projectId}/${scope}/${randomUUID()}${extension}`;

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUploadUrl(path, { upsert: false });

    if (error) throw new Error(`Signed upload creation failed: ${error.message}`);

    return {
      bucket: this.bucket,
      path,
      token: data.token,
      signedUrl: data.signedUrl
    };
  }

  async createSignedReadUrls(assets, expiresIn = 3600) {
    const entries = await Promise.all(assets.map(async (asset) => {
      if (asset.storage_bucket !== this.bucket) throw new Error('Media asset belongs to an unexpected bucket');
      const { data, error } = await this.client.storage
        .from(this.bucket)
        .createSignedUrl(asset.storage_path, expiresIn);

      if (error) throw new Error(`Signed media URL failed: ${error.message}`);
      return [asset.id, data.signedUrl];
    }));

    return new Map(entries);
  }
}
