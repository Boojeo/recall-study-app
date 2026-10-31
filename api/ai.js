import { send, readBody, checkAuth } from './_lib.js';

const MAX_CHARS = 60000;

// Proxies a request to Gemini so the API key stays on the server.
// Body: { system: string, messages: [{ role: 'user'|'model', text }], schema?: object }
export default async function handler(req, res) {
  if (!checkAuth(req, res)) return;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return send(res, 500, { error: 'GEMINI_API_KEY is not set in your Vercel environment variables.' });

  let body;
  try { body = await readBody(req); } catch (_) { return send(res, 400, { error: 'Invalid JSON' }); }
  const { system, messages, schema } = body || {};
  if (!Array.isArray(messages) || !messages.length) return send(res, 400, { error: 'No messages' });
  const size = (system || '').length + messages.reduce((n, m) => n + String(m.text || '').length, 0);
  if (size > MAX_CHARS) return send(res, 413, { error: 'That text is too long. Try a shorter section.' });

  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const request = {
    contents: messages.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: String(m.text || '') }] })),
  };
  if (system) request.systemInstruction = { parts: [{ text: String(system) }] };
  if (schema) request.generationConfig = { responseMimeType: 'application/json', responseSchema: schema };

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(request),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return send(res, 502, { error: 'Gemini: ' + (j.error?.message || r.status) });
    const cand = j.candidates?.[0];
    const text = (cand?.content?.parts || []).filter(p => !p.thought && p.text).map(p => p.text).join('');
    if (!text) return send(res, 502, { error: 'Gemini returned no answer' + (cand?.finishReason ? ` (${cand.finishReason})` : '') });
    send(res, 200, { text });
  } catch (e) {
    send(res, 502, { error: 'Could not reach Gemini: ' + e.message });
  }
}
