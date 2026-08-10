export class ApiError extends Error {
  constructor(message, { status = 0, code = 'request_failed', requestId = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export class PichassoApi {
  constructor(baseUrl) {
    this.baseUrl = String(baseUrl || 'http://localhost:10000').replace(/\/$/, '');
  }

  getPublicLibrary(slug) {
    return this.#request(`/api/v1/libraries/${encodeURIComponent(slug)}`);
  }

  listLibraries(adminKey) {
    return this.#request('/api/v1/admin/libraries', { adminKey });
  }

  getAdminLibrary(slug, adminKey) {
    return this.#request(`/api/v1/admin/libraries/${encodeURIComponent(slug)}`, { adminKey });
  }

  saveLibrary(slug, payload, adminKey) {
    return this.#request(`/api/v1/admin/libraries/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: payload,
      adminKey
    });
  }

  deleteLibrary(slug, adminKey) {
    return this.#request(`/api/v1/admin/libraries/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      adminKey
    });
  }

  async uploadImage({ projectId, file, adminKey, dimensions = {} }) {
    if (!(file instanceof File)) throw new TypeError('Yüklenecek dosya bulunamadı.');
    if (file.size > 10 * 1024 * 1024) throw new RangeError('Görsel 10 MB sınırını aşıyor.');

    const upload = await this.#request('/api/v1/admin/media/sign-upload', {
      method: 'POST',
      adminKey,
      body: { projectId, filename: file.name, mimeType: file.type }
    });

    const form = new FormData();
    form.append('cacheControl', '31536000');
    form.append('', file);
    const uploadResponse = await fetch(upload.signedUrl, {
      method: 'PUT',
      headers: { 'x-upsert': 'false' },
      body: form
    });

    if (!uploadResponse.ok) {
      throw new ApiError('Görsel depoya yüklenemedi.', { status: uploadResponse.status, code: 'media_upload_failed' });
    }

    const completed = await this.#request('/api/v1/admin/media/complete', {
      method: 'POST',
      adminKey,
      body: {
        projectId,
        bucket: upload.bucket,
        path: upload.path,
        originalName: file.name,
        mimeType: file.type,
        byteSize: file.size,
        width: dimensions.width ?? null,
        height: dimensions.height ?? null
      }
    });

    return completed.asset;
  }

  async #request(path, { method = 'GET', body, adminKey } = {}) {
    const headers = { accept: 'application/json' };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (adminKey) headers['x-admin-key'] = adminKey;

    let response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    } catch {
      throw new ApiError('Sunucuya ulaşılamadı.', { code: 'network_error' });
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(this.#messageFor(payload.error, response.status), {
        status: response.status,
        code: payload.error,
        requestId: payload.requestId
      });
    }
    return payload;
  }

  #messageFor(code, status) {
    if (status === 401) return 'Yönetim anahtarı geçersiz.';
    if (status === 404 && code === 'library_not_found') return 'Kütüphane bulunamadı veya henüz yayımlanmadı.';
    if (status === 429) return 'Çok fazla istek gönderildi. Bir dakika sonra tekrar dene.';
    if (code === 'invalid_request') return 'Gönderilen bilgiler geçersiz.';
    return 'İstek tamamlanamadı.';
  }
}
