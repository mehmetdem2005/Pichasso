export async function readJson(req, maxBytes = 16 * 1024) {
  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw new RangeError('Request body too large');
    chunks.push(chunk);
  }

  if (total === 0) return {};
  const text = Buffer.concat(chunks).toString('utf8');
  try { return JSON.parse(text); }
  catch { throw new SyntaxError('Invalid JSON body'); }
}
