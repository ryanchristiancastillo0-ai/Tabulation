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
  };

  req.on('close', () => {
    if (!settled) {
      console.log(`🛑 [stream-ui] client disconnected school=${school_id}`);
      res.end();
    }
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
    console.error(`❌ [stream-ui] failed school=${school_id}:`, err.message);
    finish({ type: 'error', error: err.safe ? err.message : 'AI generation failed. Please try again.' });
  }
};