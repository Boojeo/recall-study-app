import { send, readBody, checkAuth } from './_lib.js';
import '../merge.js';

const { merge } = globalThis.RecallMerge;

const KEY = 'recall:state';

// Upstash Redis REST API (added by the Vercel Marketplace "Upstash for Redis" integration).
async function redis(command) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Database not connected. In Vercel, open Storage and add Upstash for Redis to this project, then redeploy.');
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error('Database error: ' + (j.error || r.status));
  return j.result;
}

// The client sends its full state; the server merges it with the stored copy and returns the result.
export default async function handler(req, res) {
  if (!checkAuth(req, res)) return;
  try {
    const local = await readBody(req);
    const stored = await redis(['GET', KEY]);
    const merged = merge(stored ? JSON.parse(stored) : null, local);
    await redis(['SET', KEY, JSON.stringify(merged)]);
    send(res, 200, merged);
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}
