const windows = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const MAX_TRACKED_CLIENTS = 10_000;

export function securityHeaders(origin) {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,x-admin-key',
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
    'cross-origin-resource-policy': 'same-site',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY'
  };
}

export function consumeRateLimit(key, now = Date.now()) {
  if (windows.size > MAX_TRACKED_CLIENTS) {
    for (const [client, value] of windows) {
      if (now - value.startedAt >= WINDOW_MS) windows.delete(client);
    }
  }

  const current = windows.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    windows.set(key, { startedAt: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= MAX_REQUESTS;
}
