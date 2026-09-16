// ── In-process AI generator (no queue, no Redis, no worker) ──────────────────
// Runs the LLM generation for a `generations` record directly in the Express
// process. The request handler keeps its exact contract: it creates the
// generation row, calls startGeneration() (fire-and-forget), and either waits
// on the DB status (wait:true) or lets the frontend poll
// GET /api/ai/generations/:id as before.
//
// Concurrency: an in-flight Map keyed by schoolId+configHash dedupes identical
// concurrent requests — one LLM call, all generations for that key resolved
// from the single result. ui_cache (MySQL) remains the real cache.

const pool = require('../config/db');
const HttpError = require('../utils/http-error');
const dataService = require('../services/data.service');
const judgeService = require('../services/judge.service');
const genService = require('../services/ai-generation.service');

const JOB_TIMEOUT_MS = Number(process.env.AI_JOB_TIMEOUT_MS) || 240000;
const MAX_ATTEMPTS   = Number(process.env.AI_JOB_MAX_ATTEMPTS) || 3;
const RETRYABLE_HTTP = new Set([408, 429, 500, 502, 503, 504]);

// schoolId:configHash → Promise<{ html, promptHash }> (only while in flight)
const inFlight = new Map();

function isRetryable(err) {
  if (!err) return false;
  if (err.status && RETRYABLE_HTTP.has(err.status)) return true;
  const msg = String(err.message || '');
  return /timeout|etimedout|econnreset|econnrefused|fetch failed|network|rate.?limit|temporar/i.test(msg);
}

function withTimeout(fn, ms) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('AI generation timed out.'), { status: 504 })), ms);
  });
  const work = Promise.resolve().then(fn);
  work.catch(() => {}); // swallow late rejections — a slow LLM must never crash the server
  return Promise.race([work, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Retry only transient failures (timeout/network/5xx/429) with exponential
// backoff, matching the old BullMQ retry policy. Permanent failures throw.
async function runWithRetry(fn, attempts) {
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await withTimeout(fn, JOB_TIMEOUT_MS);
    } catch (err) {
      lastErr = err;
      console.warn(`🔁 [ai-generator] failed attempt ${attempt}/${attempts}:`, err.message);
      if (!isRetryable(err)) throw err;
      if (attempt < attempts) {
        await new Promise((r) => setTimeout(r, Math.min(3000 * 2 ** (attempt - 1), 30000)));
      }
    }
  }
  throw lastErr;
}

// Re-read contestants/criteria from MySQL (source of truth) and run the EXACT
// same renderUI + ui_cache storage path the old worker used.
async function generateFor({ schoolId, prompt, model }) {
  const all = await dataService.getAllData(schoolId);
  console.log(`📦 [ai-generator] generateFor school=${schoolId} contestants=${all.contestants?.length} criteria=${all.criteria?.length} prompt="${prompt?.slice(0,60)}..."`);
  return judgeService.renderUI({
    contestants: all.contestants || [],
    criteria:    all.criteria    || [],
    aiPrompt:    prompt,
    model:       model || undefined,
    school_id:   schoolId,
  });
}

// Fire-and-forget: start (or join) the in-process generation for this record.
// Returns the shared promise so callers that want to await can. Never rejects
// to the caller — each generation's own DB lifecycle (PROCESSING→COMPLETED/
// FAILED) is managed across the shared result.
function startGeneration({ generationId, schoolId, prompt, model, configHash }) {
  const key = `${schoolId}:${configHash}`;
  let promise = inFlight.get(key);

  // Parity with the old worker flow: each generation shows PROCESSING while its
  // work runs, even when a shared in-flight call covers multiple generations.
  genService.markProcessing(generationId).catch(() => {});

  if (!promise) {
    promise = (async () => {
      try {
        const result = await runWithRetry(() => generateFor({ schoolId, prompt, model }), MAX_ATTEMPTS);
        return result;
      } catch (err) {
        console.error(`❌ [ai-generator] generation failed generation=${generationId}:`, err.message);
        throw err;
      } finally {
        inFlight.delete(key);
      }
    })();
    inFlight.set(key, promise);
  } else {
    console.log(`♻️ [ai-generator] joining in-flight generation key=${key} generation=${generationId}`);
  }

  promise.then(
    (result) => {
      console.log(`✅ [ai-generator] markCompleted generation=${generationId} promptHash=${result?.promptHash?.slice(0,8)}`);
      return genService.markCompleted(generationId, result?.promptHash || null);
    },
    (err) => {
      console.log(`❌ [ai-generator] markFailed generation=${generationId}`);
      return genService.markFailed(generationId, err?.safe ? err.message : 'AI generation failed. Please try again.');
    }
  );

  return promise;
}

module.exports = { startGeneration };