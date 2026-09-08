// ── AI Generation Worker ────────────────────────────────────────────────────
// Pulls ai-generation jobs from Redis (BullMQ), calls the EXISTING LLM service,
// and stores results through the existing database architecture.
//
// Can run as a standalone process:  npm run worker   (in backend/)
// Or be embedded in the Express server (default — see server.js).

const { Worker } = require('bullmq');
const HttpError = require('../utils/http-error');
const pool = require('../config/db');
const { createWorkerConnection } = require('../config/redis');
const { QUEUE_NAME } = require('../config/ai-queue');
const dataService = require('../services/data.service');
const judgeService = require('../services/judge.service');
const genService = require('../services/ai-generation.service');
const { cacheSet, CACHE_TTL_SECONDS } = require('../utils/redis-cache');

const CONCURRENCY        = Number(process.env.AI_WORKER_CONCURRENCY) || 3;
const JOB_TIMEOUT_MS     = Number(process.env.AI_JOB_TIMEOUT_MS)     || 150000;
const RETRYABLE_HTTP     = new Set([408, 429, 500, 502, 503, 504]);

// ── Retry policy ─────────────────────────────────────────────────────────────
// Only transient failures (network, timeout, 5xx, rate limit) throw and get
// retried by BullMQ with exponential backoff. Permanent failures (e.g. bad
// input) mark the generation FAILED without throwing → never retried.
function isRetryable(err) {
  if (!err) return false;
  if (err.status && RETRYABLE_HTTP.has(err.status)) return true;
  const msg = String(err.message || '');
  return /timeout|etimedout|econnreset|econnrefused|fetch failed|network|rate.?limit|temporar/i.test(msg);
}

// A job can hang against a flaky LLM provider; never let one job block the
// queue forever — exceed JOB_TIMEOUT_MS and the job is retried.
function withTimeout(fn, ms) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('AI generation timed out.'), { status: 504 })), ms);
  });
  const work = Promise.resolve().then(fn);
  work.catch(() => {}); // swallow late rejections — a slow LLM must never crash the worker
  return Promise.race([work, timeoutPromise]).finally(() => clearTimeout(timer));
}

// ── Job processor ────────────────────────────────────────────────────────────
async function processJob(job) {
  const { generationId, schoolId } = job.data || {};
  const startedAt = Date.now();
  console.log(`🎨 [ai-worker] job started generation=${generationId} school=${schoolId}`);

  try {
    await genService.markProcessing(generationId);
  } catch (err) {
    console.error('❌ [ai-worker] could not mark generation PROCESSING:', err.message);
  }

  try {
    // Re-read contestants/criteria/prompt from MySQL (source of truth) and run
    // the existing LLM service + ui_cache storage exactly as before.
    const payload = await buildPayload(generationId, schoolId);
    const { html, promptHash } = await withTimeout(
      () => judgeService.renderUI(payload),
      JOB_TIMEOUT_MS
    );

    // Extra Redis layer on top of ui_cache (served when cache is healthy).
    await cacheSet(`ui:html:${schoolId}:${promptHash}`, html, CACHE_TTL_SECONDS.GENERATED_UI);

    await genService.markCompleted(generationId, promptHash);

    console.log(`✅ [ai-worker] job completed generation=${generationId} duration=${Date.now() - startedAt}ms`);
  } catch (err) {
    if (isRetryable(err)) {
      const attempt = (job.attemptsMade || 0) + 1;
      console.warn(`🔁 [ai-worker] retryable failure (attempt ${attempt}/${job.opts?.attempts ?? '?'}) generation=${generationId}:`, err.message);
      throw err; // → BullMQ retries with exponential backoff
    }
    await genService.markFailed(generationId, 'AI generation failed. Please try again.');
    console.error(`❌ [ai-worker] job failed generation=${generationId}:`, err.message);
  }
}

async function buildPayload(generationId, schoolId) {
  const [rows] = await pool.execute('SELECT prompt FROM generations WHERE id = ?', [generationId]);
  const prompt = rows[0]?.prompt;
  if (!prompt) throw new HttpError(400, 'Generation not found.');

  const all = await dataService.getAllData(schoolId);
  return {
    contestants: all.contestants || [],
    criteria:    all.criteria    || [],
    aiPrompt:    prompt,
    school_id:   schoolId,
  };
}

// ── In-process start/stop (used by server.js) ───────────────────────────────
let worker;
let workerConnection;
let started = false;

function startWorker() {
  if (started) return;
  started = true;

  workerConnection = createWorkerConnection();

  worker = new Worker(QUEUE_NAME, processJob, {
    connection:   workerConnection,
    concurrency:  CONCURRENCY,
    lockDuration: Math.max(JOB_TIMEOUT_MS + 30000, 120000),
  });

  worker.on('failed', async (job, _err) => {
    const generationId = typeof job === 'string' ? job : job?.data?.generationId;
    console.error(`❌ [ai-worker] job permanently failed after retries generation=${generationId}`);
    if (generationId) {
      await genService.markFailed(generationId, 'AI generation failed. Please try again.');
    }
  });

  worker.on('error', (err) => console.error('❌ [ai-worker] worker error:', err.message));

  console.log(`🚀 AI worker started · queue=${QUEUE_NAME} · concurrency=${CONCURRENCY} · timeout=${JOB_TIMEOUT_MS}ms`);
}

async function stopWorker() {
  if (worker) {
    try { await worker.close(); } catch { /* ignore */ }
    worker = null;
  }
  if (workerConnection) {
    try { await workerConnection.quit(); } catch { /* ignore */ }
    workerConnection = null;
  }
  started = false;
}

// ── Standalone mode: require('dotenv').config() was already at the top ───────
// When run directly via `npm run worker`, start the worker automatically.
if (require.main === module) {
  require('dotenv').config();
  const { assertRedisConfigured } = require('../config/redis');
  assertRedisConfigured('worker');
  startWorker();

  async function shutdown(signal) {
    console.log(`🛑 ${signal} received. Stopping AI worker…`);
    await stopWorker();
    await pool.end();
    console.log('✅ AI worker shut down cleanly.');
    process.exit(0);
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

module.exports = { startWorker, stopWorker };