import { send, checkAuth } from './_lib.js';

// Tells the app whether built-in AI is available (a GEMINI_API_KEY is set).
// Without one, the app hands prompts off to the Gemini app/website instead.
export default function handler(req, res) {
  if (!checkAuth(req, res)) return;
  send(res, 200, { ai: !!process.env.GEMINI_API_KEY });
}
