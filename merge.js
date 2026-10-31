// Merges two copies of the app state (e.g. phone + laptop) without losing work.
// Shared by the browser (loaded as a plain <script>) and the server (api/sync.js imports it).
(function () {
  const DAY = 86400000;
  const LOG_DAYS = 120;   // review history kept for stats
  const DEL_DAYS = 365;   // how long deletions are remembered

  function emptyState() {
    return { v: 2, cards: [], del: {}, log: [], days: [], timer: { day: 0, sessions: 0 } };
  }

  function norm(s) {
    const e = emptyState();
    if (!s || typeof s !== 'object') return e;
    return {
      v: 2,
      cards: Array.isArray(s.cards) ? s.cards.filter(c => c && c.id) : [],
      del: s.del && typeof s.del === 'object' ? s.del : {},
      log: Array.isArray(s.log) ? s.log : [],
      days: Array.isArray(s.days) ? s.days : [],
      timer: s.timer && typeof s.timer === 'object' ? s.timer : e.timer,
    };
  }

  function merge(x, y) {
    const a = norm(x), b = norm(y), now = Date.now();

    const del = {};
    for (const src of [a.del, b.del])
      for (const [id, t] of Object.entries(src))
        if (t > now - DEL_DAYS * DAY) del[id] = Math.max(del[id] || 0, t);

    // Each card: the most recently changed copy wins. Deleted cards stay deleted
    // unless they were changed after the deletion.
    const cards = new Map();
    for (const c of [...a.cards, ...b.cards]) {
      const cur = cards.get(c.id);
      if (!cur || (c.upd || 0) > (cur.upd || 0)) cards.set(c.id, c);
    }
    for (const [id, c] of cards) if (del[id] && del[id] >= (c.upd || 0)) cards.delete(id);

    const log = new Map();
    for (const l of [...a.log, ...b.log])
      if (l && l.t > now - LOG_DAYS * DAY) log.set(l.t + ':' + l.id, l);

    const ta = a.timer, tb = b.timer;
    const timer = (ta.day || 0) === (tb.day || 0)
      ? { day: ta.day || 0, sessions: Math.max(ta.sessions || 0, tb.sessions || 0) }
      : (ta.day || 0) > (tb.day || 0) ? ta : tb;

    return {
      v: 2,
      cards: [...cards.values()].sort((p, q) => (p.ct || 0) - (q.ct || 0) || (p.id < q.id ? -1 : 1)),
      del,
      log: [...log.values()].sort((p, q) => p.t - q.t),
      days: [...new Set([...a.days, ...b.days])].sort((p, q) => p - q),
      timer,
    };
  }

  globalThis.RecallMerge = { merge, emptyState };
})();
