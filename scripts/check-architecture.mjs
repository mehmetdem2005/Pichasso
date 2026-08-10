import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const violations = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (['.js', '.mjs', '.html'].includes(extname(entry.name))) files.push(full);
  }
  return files;
}

for (const file of await walk(join(root, 'apps/web'))) {
  const text = await readFile(file, 'utf8');
  if (/SUPABASE_SERVICE_ROLE_KEY|serviceRoleKey|\/rest\/v1\//.test(text)) {
    violations.push(`${relative(root, file)}: web katmanı Supabase service-role/REST erişimi içeremez.`);
  }
}

for (const file of await walk(join(root, 'apps/api/src/modules'))) {
  const rel = relative(root, file).replaceAll('\\', '/');
  const text = await readFile(file, 'utf8');
  if (rel.endsWith('.service.mjs') && /fetch\(|SupabaseRestClient/.test(text)) {
    violations.push(`${rel}: service doğrudan altyapıya erişemez; repository kullan.`);
  }
}

if (violations.length) {
  console.error('Architecture violations:\n' + violations.map((v) => `- ${v}`).join('\n'));
  process.exit(1);
}
console.log('Architecture check passed.');
