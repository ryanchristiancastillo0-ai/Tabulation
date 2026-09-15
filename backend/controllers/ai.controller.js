const HttpError = require('../utils/http-error');
const judgeService = require('../services/judge.service');
const genService = require('../services/ai-generation.service');
const { enqueueGeneration } = require('../config/ai-queue');
const { touchSchoolActivity } = require('../utils/activity');

// ── POST /api/ai/generate — enqueue, never wait for the LLM ────────────────
// Protected by requireJudge: school_id comes from the token (req.school_id).
exports.generate = async (req, res) => {
  const school_id = req.school_id;
  touchSchoolActivity(school_id);

  const { contestants, criteria, aiPrompt, aiModel, uiMode } = req.body || {};

  if (!aiPrompt)   throw new HttpError(400, 'Prompt is required.');
  if (!contestants?.length || !criteria?.length) {
    throw new HttpError(400, 'contestants and criteria are required.');
  }

  // Fast path: this exact config is already generated → return it immediately
  // so the judge table does not wait on a job for work that is already cached.
  const cached = await judgeService.prepareRender({ contestants, criteria, aiPrompt, model: aiModel, uiMode, school_id });
  if (cached.html) {
    return res.status(200).json({
      success: true,
      status:  'COMPLETED',
      result:  cached.html,
    });
  }

  // No cache and no AI generation worker available → hand the judge a fully
  // working deterministic table right away instead of a stuck "Building…"
  // spinner. Dropdowns are already capped to each criterion's percentage.
  const { buildScoreTableHtml } = judgeService;
  const fallback = buildScoreTableHtml({ contestants, criteria });

  // Default UI mode → the deterministic table IS the end result; never touch
  // the AI queue. Use renderUI (not the bare fallback) so the table is
  // persisted in ui_cache and the next judge load hits the fast path.
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

  // Create the DB record (source of truth) and enqueue a SMALL job.
  const generation = await genService.createGeneration({ schoolId: school_id, prompt: aiPrompt, model: aiModel });
  console.log(`📦 [ai] generation queued id=${generation.id} school=${school_id} model=${aiModel || 'default'}`);

  try {
    await enqueueGeneration(generation.id, school_id);
  } catch (err) {
    // Queue upstream unavailable → do NOT pretend the job was queued, but also
    // never leave the judge stuck: return the deterministic fallback table.
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

  if (fallback) {
    // Don't block the judge on the queue: show the deterministic table now,
    // the worker upgrades it to the AI version in the background.
    return res.status(200).json({
      success:     true,
      status:      'COMPLETED',
      fallback:    true,
      result:      fallback,
      generationId: generation.id,
    });
  }

  return res.status(202).json({
    success: true,
    generationId: generation.id,
    status:  'QUEUED',
  });
};

// ── GET /api/ai/generations/:id — status (school comes from the token) ─────
exports.generationStatus = async (req, res) => {
  touchSchoolActivity(req.school_id);
  res.json(await genService.getGeneration(req.params.id, req.school_id));
};