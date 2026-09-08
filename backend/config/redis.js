// ── Centralized Upstash Redis configuration ──────────────────────────────────
// • @upstash/redis (REST) — application caching.
// • ioredis — the BullMQ AI-generation queue (Upstash's Redis-compatible TCP URL).
// Credentials come ONLY from environment variables — never hardcoded, never
// exposed to the frontend/Vite.
//
// Upstash requires TLS; we enable it automatically for *.upstash.io hosts so a
// local Redis instance (no TLS) still works during development.

const { Redis } = require('@upstash/redis');
const IORedis = require('ioredis');

// BullMQ issues blocking commands, so its ioredis connections need these options.
const QUEUE_CONNECTION_OPTIONS = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// ── Env accessors ─────────────────────────────────────────────────────────────
function getTcpUrl()  { return process.env.UPSTASH_REDIS_URL; }
function getRestUrl() { return process.env.UPSTASH_REDIS_REST_URL; }
function getRestToken() { return process.env.UPSTASH_REDIS_REST_TOKEN; }

// Throws a clear configuration error at startup instead of leaving the app to
// fail with a confusing runtime error. Never logs the token value.
function assertRedisConfigured(context = 'server') {
  const missing = [];
  if (!getTcpUrl())   missing.push('UPSTASH_REDIS_URL (Redis-compatible TCP URL used by the AI queue)');
  if (!getRestUrl())  missing.push('UPSTASH_REDIS_REST_URL (used for application caching)');
  if (!getRestToken()) missing.push('UPSTASH_REDIS_REST_TOKEN (used for application caching)');

  if (missing.length > 0) {
    throw new Error(
      `[redis] Upstash Redis is not configured for the ${context} process. ` +
      `Set the following environment variable(s), then restart: ${missing.join(', ')}`
    );
  }
}

// ── Application cache client (@upstash/redis REST) — single reusable instance ─
let cacheClient;
function getCacheClient() {
  assertRedisConfigured('cache');
  if (!cacheClient) {
    cacheClient = new Redis({
      url:      getRestUrl(),
      token:    getRestToken(),
      // We serialize ourselves so large HTML strings are never misinterpreted as JSON.
      automaticDeserialization: false,
    });
  }
  return cacheClient;
}

// ── BullMQ connection helpers ────────────────────────────────────────────────
function buildQueueOptions() {
  const options = { ...QUEUE_CONNECTION_OPTIONS };
  const url = getTcpUrl();
  if (url && url.includes('.upstash.io')) options.tls = {};
  return options;
}

// Producer side (Queue / QueueEvents in the Express process) — shared singleton.
let queueConnection;
function getQueueConnection() {
  assertRedisConfigured('queue');
  if (!queueConnection) {
    queueConnection = new IORedis(getTcpUrl(), buildQueueOptions());
    queueConnection.on('error', (err) =>
      console.error('❌ [redis] AI queue connection error:', err.message)
    );
  }
  return queueConnection;
}

// Worker side — a SEPARATE connection is required because BullMQ Workers use
// blocking commands. Rely on Redis ephemeral/expiry handling etc.; no polling.
function createWorkerConnection() {
  assertRedisConfigured('worker');
  const connection = new IORedis(getTcpUrl(), buildQueueOptions());
  connection.on('error', (err) =>
    console.error('❌ [redis] AI worker connection error:', err.message)
  );
  return connection;
}

// ── Shutdown ──────────────────────────────────────────────────────────────────
async function closeAll() {
  if (queueConnection) {
    try { await queueConnection.quit(); } catch (err) { console.error('❌ [redis] error closing queue connection:', err.message); }
  }
  // @upstash/redis is stateless (REST) — nothing to close.
}

module.exports = {
  assertRedisConfigured,
  getCacheClient,
  getQueueConnection,
  createWorkerConnection,
  closeAll,
};