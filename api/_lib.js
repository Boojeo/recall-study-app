import { createHash, timingSafeEqual } from 'node:crypto';

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export async function readBody(req) {
  if (req.body !== undefined && req.body !== null && req.body !== '')
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

const sha = s => createHash('sha256').update(String(s)).digest();

// Every request must carry the APP_PASSWORD (URI-encoded so any language works in a header).
// Returns true if the request may continue; otherwise it has already responded.
export function checkAuth(req, res) {
  if (req.method !== 'POST') { send(res, 405, { error: 'Use POST' }); return false; }
  const expected = process.env.APP_PASSWORD;
  if (!expected) { send(res, 500, { error: 'APP_PASSWORD is not set in your Vercel environment variables.' }); return false; }
  let got = '';
  try { got = decodeURIComponent(req.headers['x-app-password'] || ''); } catch (_) {}
  if (!timingSafeEqual(sha(got), sha(expected))) { send(res, 401, { error: 'Wrong password' }); return false; }
  return true;
}
