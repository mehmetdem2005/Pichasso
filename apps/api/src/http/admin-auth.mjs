import { timingSafeEqual } from 'node:crypto';

export function isAdminRequest(req, expectedKey) {
  const provided = req.headers['x-admin-key'];
  if (typeof provided !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expectedKey);
  return a.length === b.length && timingSafeEqual(a, b);
}
