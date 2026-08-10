import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { loadEnv } from './config/env.mjs';
import { createSupabaseAdminClient } from './lib/supabase.mjs';
import { CoreRepository } from './modules/core/core.repository.mjs';
import { CoreService } from './modules/core/core.service.mjs';
import { MediaService } from './modules/media/media.service.mjs';
import { LibraryRepository } from './modules/library/library.repository.mjs';
import { LibraryService } from './modules/library/library.service.mjs';
import { consumeRateLimit, securityHeaders } from './http/security.mjs';
import { isAdminRequest } from './http/admin-auth.mjs';
import { readJson } from './http/body.mjs';
import { sendJson } from './http/respond.mjs';

const env = loadEnv();
const supabase = createSupabaseAdminClient({ url: env.supabaseUrl, key: env.supabaseAdminKey });
const coreService = new CoreService(new CoreRepository(supabase));
const mediaService = new MediaService({ client: supabase, bucket: env.mediaBucket });
const libraryService = new LibraryService({
  repository: new LibraryRepository(supabase),
  mediaService
});

const PROJECT_SLUG = 'pichasso';
const PUBLIC_LIBRARY_ROUTE = /^\/api\/v1\/libraries\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const ADMIN_LIBRARY_ROUTE = /^\/api\/v1\/admin\/libraries\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;

function adminOnly(req, res, headers, requestId) {
  if (isAdminRequest(req, env.adminApiKey)) return true;
  sendJson(res, 401, { error: 'unauthorized', requestId }, headers);
  return false;
}

const server = createServer(async (req, res) => {
  const requestId = randomUUID();
  const baseHeaders = { ...securityHeaders(env.webOrigin), 'x-request-id': requestId };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, baseHeaders);
    return res.end();
  }

  const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (!consumeRateLimit(clientIp)) return sendJson(res, 429, { error: 'rate_limited', requestId }, baseHeaders);

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { status: 'ok' }, baseHeaders);
    }

    if (req.method === 'GET' && url.pathname === '/api/v1/project') {
      const payload = await coreService.getProjectSnapshot(url.searchParams.get('slug') ?? 'pichasso');
      if (!payload) return sendJson(res, 404, { error: 'project_not_found', requestId }, baseHeaders);
      return sendJson(res, 200, payload, { ...baseHeaders, 'cache-control': 'public, max-age=30, stale-while-revalidate=120' });
    }

    const publicLibraryMatch = url.pathname.match(PUBLIC_LIBRARY_ROUTE);
    if (req.method === 'GET' && publicLibraryMatch) {
      const payload = await libraryService.getPublicLibrary(PROJECT_SLUG, publicLibraryMatch[1]);
      if (!payload) return sendJson(res, 404, { error: 'library_not_found', requestId }, baseHeaders);
      return sendJson(res, 200, payload, { ...baseHeaders, 'cache-control': 'public, max-age=60' });
    }

    if (req.method === 'GET' && url.pathname === '/api/v1/admin/libraries') {
      if (!adminOnly(req, res, baseHeaders, requestId)) return;
      const payload = await libraryService.listLibraries(PROJECT_SLUG);
      if (!payload) return sendJson(res, 404, { error: 'project_not_found', requestId }, baseHeaders);
      return sendJson(res, 200, payload, baseHeaders);
    }

    const adminLibraryMatch = url.pathname.match(ADMIN_LIBRARY_ROUTE);
    if (req.method === 'GET' && adminLibraryMatch) {
      if (!adminOnly(req, res, baseHeaders, requestId)) return;
      const payload = await libraryService.getAdminLibrary(PROJECT_SLUG, adminLibraryMatch[1]);
      if (!payload) return sendJson(res, 404, { error: 'library_not_found', requestId }, baseHeaders);
      return sendJson(res, 200, payload, baseHeaders);
    }

    if (req.method === 'PUT' && adminLibraryMatch) {
      if (!adminOnly(req, res, baseHeaders, requestId)) return;
      const body = await readJson(req, 256 * 1024);
      if (body.slug && body.slug !== adminLibraryMatch[1]) {
        return sendJson(res, 400, { error: 'slug_mismatch', requestId }, baseHeaders);
      }
      const payload = await libraryService.saveLibrary(PROJECT_SLUG, { ...body, slug: adminLibraryMatch[1] });
      return sendJson(res, 200, payload, baseHeaders);
    }

    if (req.method === 'DELETE' && adminLibraryMatch) {
      if (!adminOnly(req, res, baseHeaders, requestId)) return;
      const deleted = await libraryService.deleteLibrary(PROJECT_SLUG, adminLibraryMatch[1]);
      if (!deleted) return sendJson(res, 404, { error: 'library_not_found', requestId }, baseHeaders);
      return sendJson(res, 200, { deleted: true }, baseHeaders);
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/admin/media/sign-upload') {
      if (!adminOnly(req, res, baseHeaders, requestId)) return;
      const body = await readJson(req);
      const upload = await mediaService.createSignedUpload(body);
      return sendJson(res, 201, upload, baseHeaders);
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/admin/media/complete') {
      if (!adminOnly(req, res, baseHeaders, requestId)) return;
      const body = await readJson(req);
      if (!body.projectId || !body.path || !body.originalName || !body.mimeType) {
        return sendJson(res, 400, { error: 'invalid_media_metadata', requestId }, baseHeaders);
      }
      if (body.bucket && body.bucket !== env.mediaBucket) {
        return sendJson(res, 400, { error: 'invalid_media_bucket', requestId }, baseHeaders);
      }
      if (!body.path.startsWith(`projects/${body.projectId}/`)) {
        return sendJson(res, 400, { error: 'invalid_media_path', requestId }, baseHeaders);
      }

      const asset = await coreService.registerMediaAsset({
        projectId: body.projectId,
        moduleId: body.moduleId ?? null,
        bucket: env.mediaBucket,
        path: body.path,
        originalName: body.originalName,
        mimeType: body.mimeType,
        byteSize: body.byteSize ?? null,
        width: body.width ?? null,
        height: body.height ?? null,
        metadata: body.metadata ?? {}
      });
      return sendJson(res, 201, { asset }, baseHeaders);
    }

    return sendJson(res, 404, { error: 'not_found', requestId }, baseHeaders);
  } catch (error) {
    const clientError = error instanceof TypeError || error instanceof SyntaxError || error instanceof RangeError;
    console.error(JSON.stringify({ level: clientError ? 'warn' : 'error', requestId, message: error instanceof Error ? error.message : String(error) }));
    return sendJson(res, clientError ? 400 : 500, { error: clientError ? 'invalid_request' : 'service_unavailable', requestId }, baseHeaders);
  }
});

server.listen(env.port, env.host, () => {
  console.log(JSON.stringify({ level: 'info', message: 'Pichasso API listening', host: env.host, port: env.port }));
});
