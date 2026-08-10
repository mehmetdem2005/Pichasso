import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { loadEnv } from './config/env.mjs';
import { SupabaseRestClient } from './lib/supabase-rest.mjs';
import { CardsRepository } from './modules/cards/cards.repository.mjs';
import { CardsService } from './modules/cards/cards.service.mjs';
import { consumeRateLimit, securityHeaders } from './http/security.mjs';
import { sendJson } from './http/respond.mjs';

const env = loadEnv();
const db = new SupabaseRestClient({ baseUrl: env.supabaseUrl, serviceRoleKey: env.supabaseServiceRoleKey });
const cardsService = new CardsService(new CardsRepository(db));

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

    if (req.method === 'GET' && url.pathname === '/api/v1/cards') {
      const controller = new AbortController();
      const abort = () => controller.abort();
      req.once('close', abort);
      const payload = await cardsService.getPublishedCards({ signal: controller.signal });
      req.off('close', abort);
      return sendJson(res, 200, payload, { ...baseHeaders, 'cache-control': 'public, max-age=30, stale-while-revalidate=120' });
    }

    return sendJson(res, 404, { error: 'not_found', requestId }, baseHeaders);
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', requestId, message: error instanceof Error ? error.message : String(error) }));
    return sendJson(res, 500, { error: 'content_unavailable', requestId }, baseHeaders);
  }
});

server.listen(env.port, env.host, () => {
  console.log(JSON.stringify({ level: 'info', message: 'Pichasso API listening', host: env.host, port: env.port }));
});
