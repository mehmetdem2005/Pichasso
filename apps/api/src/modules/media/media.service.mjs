import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const SIGNED_READ_TTL_SECONDS = 600;

export { SIGNED_READ_TTL_SECONDS };

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

  async attachSignedUrls(assets, expiresInSeconds = SIGNED_READ_TTL_SECONDS) {
    const readable = assets.filter((asset) => asset.bucket === this.bucket);
    if (readable.length === 0) return [];

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrls(readable.map((asset) => asset.path), expiresInSeconds);

    if (error) throw new Error(`Signed download creation failed: ${error.message}`);

    const urlsByPath = new Map((data ?? []).map((entry) => [entry.path, entry.signedUrl]));

    return readable
      .map(({ bucket, path, ...asset }) => ({ ...asset, url: urlsByPath.get(path) ?? null }))
      .filter((asset) => asset.url !== null);
  }
}
