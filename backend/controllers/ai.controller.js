const HttpError = require('../utils/http-error');
const judgeService = require('../services/judge.service');
const genService = require('../services/ai-generation.service');
const { enqueueGeneration } = require('../config/ai-queue');
const { touchSchoolActivity } = require('../utils/activity');

const WAIT_POLL_MS = 2500;

async function waitForGeneration(generationId, schoolId, maxWaitMs) {
  const inFlight = new Set(['QUEUED', 'PROCESSING']);
  const deadline = Date.now() + maxWaitMs;
  let last;
  while (Date.now() < deadline) {
    last = await genService.getGeneration(generationId, schoolId);
    if (!inFlight.has(last.status)) return last;
    await new Promise((r) => setTimeout(r, WAIT_POLL_MS));
  }
  return last || {};
}

// ── POST /api/ai/generate — enqueue; optionally wait for the LLM ────────────
exports.generate = async (req, res) => {
  const school_id = req.school_id;
  touchSchoolActivity(school_id);

  const { contestants, criteria, aiPrompt, aiModel, uiMode } = req.body || {};

  if (!aiPrompt)   throw new HttpError(400, 'Prompt is required.');
  if (!contestants?.length || !criteria?.length) {
    throw new HttpError(400, 'contestants and criteria are required.');
  }

  // ✅ FIX: accept `true`, `1`, and `"true"` as "wait". The React client used
  // to send `wait: 1` (a number), which `=== true` rejected, so the judge
  // ALWAYS got the deterministic fallback and never the live AI design. The
  // client now sends the boolean, but keeping the server tolerant means old
  // clients (or curl tests like `{"wait":1}`) behave correctly too.
  const wait =
    req.body.wait === true ||
    req.body.wait === 1 ||
    req.body.wait === 'true' ||
    req.body.wait === '1';

  const cached = await judgeService.prepareRender({
    contestants, criteria, aiPrompt, model: aiModel, uiMode, school_id,
  });
  if (cached.html) {
    return res.status(200).json({
      success: true,
      status:  'COMPLETED',
      result:  cached.html,
    });
  }

  const { buildScoreTableHtml } = judgeService;
  const fallback = buildScoreTableHtml({ contestants, criteria });

  if (cached.finalUiMode === 'default') {
    const { html } = await judgeService.renderUI({
      contestants, criteria, aiPrompt, model: aiModel, uiMode, school_id,
    });
    return res.status(200).json({
      success: true,
      status:  'COMPLETED',
      result:  html,
    });
  }

  const generation = await genService.createGeneration({
    schoolId: school_id, prompt: aiPrompt, model: aiModel,
  });
  console.log(`📦 [ai] generation queued id=${generation.id} school=${school_id} model=${aiModel || 'default'} wait=${wait}`);

  try {
    await enqueueGeneration(generation.id, school_id);
  } catch (err) {
    await genService.markFailed(generation.id, 'Generation service is temporarily unavailable.');
    console.error('❌ [ai] failed to enqueue generation:', err.message);
    if (fallback) {
      return res.status(200).json({
        success:     true,
        status:      'COMPLETED',
        fallback:    true,
        result:      fallback,
        error:       'Real-time interface preview is unavailable — showing the standard scoring table instead.',
      });
    }
    throw new HttpError(503, 'AI generation is not available right now. Please try again later.');
  }

  if (fallback && wait) {
    const maxWaitMs = Number(process.env.AI_WAIT_TIMEOUT_MS) || 80000;
    const done = await waitForGeneration(generation.id, school_id, maxWaitMs);

    if (done.status === 'COMPLETED' && done.result) {
      return res.status(200).json({ success: true, status: 'COMPLETED', result: done.result });
    }
    if (done.status === 'FAILED') {
      return res.status(200).json({
        success:      true,
        status:       'FAILED',
        fallback:     true,
        result:       fallback,
        generationId: generation.id,
        error:        done.error || 'AI generation failed. Showing the standard scoring table instead.',
      });
    }
    return res.status(200).json({
      success:      true,
      status:       'PROCESSING',
      fallback:     true,
      result:       fallback,
      generationId: generation.id,
    });
  }

  if (fallback) {
    return res.status(200).json({
      success:      true,
      status:       'COMPLETED',
      fallback:     true,
      result:       fallback,
      generationId: generation.id,
    });
  }

  return res.status(202).json({
    success:      true,
    generationId: generation.id,
    status:       'QUEUED',
  });
};

// ── GET /api/ai/generations/:id — status (school comes from the token) ─────
exports.generationStatus = async (req, res) => {
  touchSchoolActivity(req.school_id);
  res.json(await genService.getGeneration(req.params.id, req.school_id));
};