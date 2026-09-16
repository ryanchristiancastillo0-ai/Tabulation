const HttpError = require('../utils/http-error');
const judgeService = require('../services/judge.service');
const genService = require('../services/ai-generation.service');
const { startGeneration } = require('../services/ai-generator.service');
const { touchSchoolActivity } = require('../utils/activity');

const WAIT_POLL_MS = 2500;

async function waitForGeneration(generationId, schoolId, maxWaitMs) {
  const inFlight = new Set(['QUEUED', 'PROCESSING']);
  const deadline = Date.now() + maxWaitMs;
  let last;
  console.log(`⏳ [ai] waitForGeneration started id=${generationId} school=${schoolId} maxWait=${maxWaitMs}ms`);
  while (Date.now() < deadline) {
    last = await genService.getGeneration(generationId, schoolId);
    console.log(`🔄 [ai] poll generation id=${generationId} status=${last?.status} hasResult=${!!last?.result}`);
    if (!inFlight.has(last.status)) {
      console.log(`✅ [ai] waitForGeneration done id=${generationId} finalStatus=${last?.status}`);
      return last;
    }
    await new Promise((r) => setTimeout(r, WAIT_POLL_MS));
  }
  console.log(`⏰ [ai] waitForGeneration timeout id=${generationId} lastStatus=${last?.status}`);
  return last || {};
}

// ── POST /api/ai/generate — start in-process generation; optionally wait ────
exports.generate = async (req, res) => {
  const school_id = req.school_id;
  touchSchoolActivity(school_id);

  const { contestants, criteria, aiPrompt, aiModel, aiProvider, uiMode, wait: waitBody } = req.body || {};

  console.log(`📥 [ai.generate] school=${school_id} prompt="${aiPrompt?.slice(0,80)}..." provider=${aiProvider} model=${aiModel} uiMode=${uiMode} wait=${waitBody} contestants=${contestants?.length} criteria=${criteria?.length}`);

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

  console.log(`🔍 [ai.generate] wait flag evaluated: ${wait} (raw: ${JSON.stringify(req.body.wait)})`);

  const cached = await judgeService.prepareRender({
    contestants, criteria, aiPrompt, model: aiModel, provider: aiProvider, uiMode, school_id,
  });
  console.log(`📋 [ai.generate] prepareRender cached.html=${!!cached.html} finalUiMode=${cached.finalUiMode} configHash=${cached.configHash?.slice(0,8)}`);

  if (cached.html) {
    console.log(`⚡ [ai.generate] CACHE HIT — returning cached HTML`);
    return res.status(200).json({
      success: true,
      status:  'COMPLETED',
      result:  cached.html,
    });
  }

  const { buildScoreTableHtml } = judgeService;
  const fallback = buildScoreTableHtml({ contestants, criteria });

  if (cached.finalUiMode === 'default') {
    console.log(`📋 [ai.generate] uiMode=default — rendering static table`);
    const { html } = await judgeService.renderUI({
      contestants, criteria, aiPrompt, model: aiModel, provider: aiProvider, uiMode, school_id,
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
  console.log(`📦 [ai.generate] generation created id=${generation.id} school=${school_id} model=${aiModel || 'default'} wait=${wait}`);

  try {
    startGeneration({
      generationId: generation.id,
      schoolId:     school_id,
      prompt:       aiPrompt,
      model:        aiModel,
      configHash:   cached.configHash,
    });
    console.log(`✅ [ai.generate] startGeneration (in-process) id=${generation.id}`);
  } catch (err) {
    await genService.markFailed(generation.id, 'Generation service is temporarily unavailable.');
    console.error('❌ [ai.generate] failed to start generation:', err.message);
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
    const maxWaitMs = Number(process.env.AI_WAIT_TIMEOUT_MS) || 220000;
    console.log(`⏳ [ai.generate] waiting for generation id=${generation.id} maxWait=${maxWaitMs}ms`);
    const done = await waitForGeneration(generation.id, school_id, maxWaitMs);

    if (done.status === 'COMPLETED' && done.result) {
      console.log(`✅ [ai.generate] generation COMPLETED with result id=${generation.id}`);
      return res.status(200).json({ success: true, status: 'COMPLETED', result: done.result });
    }
    if (done.status === 'FAILED') {
      console.log(`❌ [ai.generate] generation FAILED id=${generation.id} error=${done.error}`);
      return res.status(200).json({
        success:      true,
        status:       'FAILED',
        fallback:     true,
        result:       fallback,
        generationId: generation.id,
        error:        done.error || 'AI generation failed. Showing the standard scoring table instead.',
      });
    }
    console.log(`⏳ [ai.generate] generation still PROCESSING after wait id=${generation.id}`);
    return res.status(200).json({
      success:      true,
      status:       'PROCESSING',
      fallback:     true,
      result:       fallback,
      generationId: generation.id,
    });
  }

  if (fallback) {
    console.log(`📤 [ai.generate] returning fallback immediately (no wait) id=${generation.id}`);
    return res.status(200).json({
      success:      true,
      status:       'COMPLETED',
      fallback:     true,
      result:       fallback,
      generationId: generation.id,
    });
  }

  console.log(`📤 [ai.generate] returning QUEUED (no fallback) id=${generation.id}`);
  return res.status(202).json({
    success:      true,
    generationId: generation.id,
    status:       'QUEUED',
  });
};

// ── GET /api/ai/generations/:id — status (school comes from the token) ─────
exports.generationStatus = async (req, res) => {
  touchSchoolActivity(req.school_id);
  const result = await genService.getGeneration(req.params.id, req.school_id);
  console.log(`📊 [ai.generationStatus] id=${req.params.id} status=${result.status} hasResult=${!!result.result}`);
  res.json(result);
};