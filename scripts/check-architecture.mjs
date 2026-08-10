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
  if (/SUPABASE_(SECRET|SERVICE_ROLE)_KEY|createClient\(|\/rest\/v1\/|\.storage\./.test(text)) {
    violations.push(`${relative(root, file)}: web katmanı doğrudan Supabase admin/database/storage erişimi içeremez.`);
  }
  if (/\bfetch\s*\(/.test(text) && !file.endsWith('api-client.js')) {
    violations.push(`${relative(root, file)}: ağ erişimi yalnızca api-client.js içinde bulunabilir.`);
  }
}

for (const file of await walk(join(root, 'apps/api/src/modules'))) {
  const rel = relative(root, file).replaceAll('\\', '/');
  const text = await readFile(file, 'utf8');
  if (rel.endsWith('.service.mjs') && /\.from\(['"`]|\/rest\/v1\//.test(text) && !rel.includes('/media/')) {
    violations.push(`${rel}: domain service doğrudan veri kaynağına erişemez; repository kullan.`);
  }
}

if (violations.length) {
  console.error('Architecture violations:\n' + violations.map((v) => `- ${v}`).join('\n'));
  process.exit(1);
}
console.log('Architecture check passed.');
