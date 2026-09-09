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

  const { contestants, criteria, aiPrompt } = req.body || {};

  if (!aiPrompt)   throw new HttpError(400, 'Prompt is required.');
  if (!contestants?.length || !criteria?.length) {
    throw new HttpError(400, 'contestants and criteria are required.');
  }

  // Fast path: this exact config is already generated → return it immediately
  // so the judge table does not wait on a job for work that is already cached.
  const cached = await judgeService.prepareRender({ contestants, criteria, aiPrompt, school_id });
  if (cached.html) {
    return res.status(200).json({
      success: true,
      status:  'COMPLETED',
      result:  cached.html,
    });
  }

  // Create the DB record (source of truth) and enqueue a SMALL job.
  const generation = await genService.createGeneration({ schoolId: school_id, prompt: aiPrompt });
  console.log(`📦 [ai] generation queued id=${generation.id} school=${school_id}`);

  try {
    await enqueueGeneration(generation.id, school_id);
  } catch (err) {
    // Queue upstream unavailable → do NOT pretend the job was queued.
    await genService.markFailed(generation.id, 'Generation service is temporarily unavailable.');
    console.error('❌ [ai] failed to enqueue generation:', err.message);
    throw new HttpError(503, 'AI generation is not available right now. Please try again later.');
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