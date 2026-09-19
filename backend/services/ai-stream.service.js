// ── Admin-side AI UI generation with LIVE streaming ──────────────────────────
// The admin Dashboard streams the LLM output here in real time (the terminal
// they watch), and on completion the exact same prompt/finalizer as the
// one-shot path (judge.service) writes the design into ui_cache. The judge page
// never generates — it only reads ui_cache, so it is a pure consumer.
//
// The school's own data is re-read from MySQL here (never the client's in-memory
// ids) so the configHash — and therefore the ui_cache row — always matches what
// the judge computes from /get-all-data. Client-supplied ids (Date.now()
// placeholders) would otherwise produce a different hash and a permanent
// cache-miss for the judges.

const pool = require('../config/db');
const dataService = require('./data.service');
const judgeService = require('./judge.service');
const genService = require('./ai-generation.service');
const aiService = require('../ai/ai-service');

// ── main entry: read fresh data → cache-check → stream → persist ─────────────
async function streamJudgeUI({ school_id, onDelta }) {
  const all = await dataService.getAllData(school_id);
  const contestants = all.contestants || [];
  const criteria    = all.criteria    || [];
  const settings    = all.settings    || {};

  if (!contestants.length || !criteria.length) {
    const err = new Error('Cannot generate the Judge UI yet — add contestants and criteria first.');
    err.safe = true;
    throw err;
  }

  const prep = await judgeService.prepareRender({
    contestants,
    criteria,
    aiPrompt: settings.ai_prompt,
    model:    settings.ai_model,
    provider: settings.ai_provider,
    uiMode:   settings.ui_mode,
    school_id,
  });

  // Already cached (same prompt/criteria/model/mode) → no provider call at all.
  if (prep.html) {
    console.log(`⚡ [stream-ui] cache hit hash=${prep.configHash.slice(0, 8)} — returning stored HTML`);
    return { html: prep.html, promptHash: prep.configHash, fromCache: true, generationId: null };
  }

  // Default mode → store the deterministic static table (no AI, no stream).
  if (prep.finalUiMode === 'default') {
    console.log(`📋 [stream-ui] uiMode=default — caching static table`);
    const { html, promptHash } = await judgeService.renderUI({
      contestants, criteria,
      aiPrompt: settings.ai_prompt, model: settings.ai_model, uiMode: settings.ui_mode,
      school_id,
    });
    return { html, promptHash, fromCache: false, generationId: null };
  }

  // AI mode → record the job, then stream the LLM response live.
  const generation = await genService.createGeneration({
    schoolId: school_id,
    prompt:   prep.finalDesignGoal,
    model:    prep.finalModel,
  });
  const generationId = generation.id;
  await genService.markProcessing(generationId);

  const instruction = judgeService.buildAiInstruction(prep);
  console.log(`🤖 [stream-ui] streaming provider=${prep.finalProvider} model=${prep.finalModel} generation=${generationId} promptLength=${instruction.length}`);

  const rawHtml = await aiService.generate({
    provider: prep.finalProvider,
    model: prep.finalModel,
    prompt: instruction,
    onDelta,
  });

  const finalHtml = judgeService.finalizeAiHtml(rawHtml, contestants, criteria);
  await pool.execute(
    `INSERT INTO ui_cache (prompt_hash, school_id, design_type, html_content)
     VALUES (?, ?, 'ai', ?)
     ON DUPLICATE KEY UPDATE
       design_type  = VALUES(design_type),
       html_content = VALUES(html_content)`,
    [prep.configHash, school_id, finalHtml]
  );
  await genService.markCompleted(generationId, prep.configHash);
  console.log(`✅ [stream-ui] cached hash=${prep.configHash.slice(0, 8)} finalLength=${finalHtml.length}`);

  return { html: finalHtml, generationId, promptHash: prep.configHash, fromCache: false };
}

module.exports = { streamJudgeUI };