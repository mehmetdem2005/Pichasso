function requireUrl(name, value) {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  try { return new URL(value).toString().replace(/\/$/, ''); }
  catch { throw new Error(`Invalid URL in environment variable: ${name}`); }
}

export function loadEnv(source = process.env) {
  const serviceKey = source.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey.length < 20) throw new Error('Missing or invalid SUPABASE_SERVICE_ROLE_KEY');

  return Object.freeze({
    nodeEnv: source.NODE_ENV ?? 'development',
    host: source.HOST ?? '0.0.0.0',
    port: Number.parseInt(source.PORT ?? '10000', 10),
    webOrigin: requireUrl('WEB_ORIGIN', source.WEB_ORIGIN ?? 'http://localhost:5173'),
    supabaseUrl: requireUrl('SUPABASE_URL', source.SUPABASE_URL),
    supabaseServiceRoleKey: serviceKey
  });
}
