import { writeFile } from 'node:fs/promises';

const apiBaseUrl = process.env.API_BASE_URL;
if (!apiBaseUrl) throw new Error('API_BASE_URL is required');

const normalized = new URL(apiBaseUrl).toString().replace(/\/$/, '');
await writeFile(
  new URL('../apps/web/config.js', import.meta.url),
  `window.__PICHASSO_CONFIG__ = Object.freeze({ apiBaseUrl: ${JSON.stringify(normalized)} });\n`,
  'utf8'
);

console.log('Web configuration generated.');
