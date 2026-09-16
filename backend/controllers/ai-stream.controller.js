const { touchSchoolActivity } = require('../utils/activity');
const { streamJudgeUI } = require('../services/ai-stream.service');

// ── POST /api/stream-ui (admin token via requireAuth) ─────────────────────────
// Responds as Server-Sent Events so the admin terminal can show the LLM code
// token-by-token. Stream contract (one JSON per `data:` line):
//   { "type": "delta", "text": "…" }   → live code chunk
//   { "type": "done",  "html": … , "generationId": … }   → success
//   { "type": "error", "error": "…" }  → terminal failure
exports.stream = async (req, res) => {
  const school_id = req.school_id;
  touchSchoolActivity(school_id);

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (obj) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  let settled = false;
  const finish = (obj) => {
    if (settled) return;
    settled = true;
    try { send(obj); } catch { /* client gone */ }
    try { res.end(); } catch { /* client gone */ }
    clearInterval(ping);
  };

  // Keep the proxy connection alive during long generations (free-tier
  // rate limits can delay the first token for minutes). The client ignores
  // unknown event types, so `ping` is safe. Also flushes headers immediately.
  const ping = setInterval(() => {
    send({ type: 'ping', t: Date.now() });
  }, 10000);
  ping.unref();
  send({ type: 'status', message: 'connected' });

  // IMPORTANT: listen on `res` — NOT `req`. `req` emits 'close' once the POST
  // body is fully parsed (right after express.json()), which would close this
  // SSE stream instantly and the client would see a dangling connection with
  // no 'done'/'error' event ("AI generation was interrupted"). `res` emits
  // 'close' only when the response actually ends or the socket dies.
  res.on('close', () => {
    if (!settled) console.log(`🛑 [stream-ui] connection closed before done school=${school_id}`);
    clearInterval(ping);
  });
  res.on('error', (err) => {
    console.error(`🔥 [stream-ui] response error school=${school_id}:`, err.message);
    clearInterval(ping);
  });

  try {
    const result = await streamJudgeUI({
      school_id,
      onDelta: (text) => send({ type: 'delta', text }),
    });
    finish({
      type:         'done',
      html:         result.html,
      generationId: result.generationId || null,
      promptHash:   result.promptHash,
      fromCache:    result.fromCache,
    });
  } catch (err) {
    console.error(`❌ [stream-ui] failed school=${school_id}:`, err.message, err.stack || '');
    finish({ type: 'error', error: err.safe ? err.message : 'AI generation failed. Please try again.' });
  }
};