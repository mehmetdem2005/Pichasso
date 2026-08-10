function requireUrl(name, value) {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  try { return new URL(value).toString().replace(/\/$/, ''); }
  catch { throw new Error(`Invalid URL in environment variable: ${name}`); }
}

export function loadEnv(source = process.env) {
  const adminKey = source.SUPABASE_SECRET_KEY ?? source.SUPABASE_SERVICE_ROLE_KEY;
  if (!adminKey || adminKey.length < 20) throw new Error('Missing SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)');

  return Object.freeze({
    nodeEnv: source.NODE_ENV ?? 'development',
    host: source.HOST ?? '0.0.0.0',
    port: Number.parseInt(source.PORT ?? '10000', 10),
    webOrigin: requireUrl('WEB_ORIGIN', source.WEB_ORIGIN ?? 'http://localhost:5173'),
    supabaseUrl: requireUrl('SUPABASE_URL', source.SUPABASE_URL),
    supabaseAdminKey: adminKey
  });
}
