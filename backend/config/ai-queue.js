// ── BullMQ queue for AI UI generation ─────────────────────────────────────────
// Only expensive LLM generation uses this queue. Normal API requests never do.
// The Redis payload stays tiny (generationId + schoolId); the prompt/data live
// in MySQL and the worker re-reads them from the database.
//
// jobId === generationId → dedupe + trivial status mapping + no huge payloads.

const { Queue } = require('bullmq');
const { getQueueConnection } = require('./redis');

const QUEUE_NAME = 'ai-generation';

// Retries: transient failures (network/timeout/5xx/429) throw from the worker
// and BullMQ retries with exponential backoff; permanent failures are marked
// FAILED in the DB without throwing, so they are never retried.
function createAiQueue() {
  return new Queue(QUEUE_NAME, {
    connection: getQueueConnection(),
    defaultJobOptions: {
      attempts: Number(process.env.AI_JOB_MAX_ATTEMPTS) || 3,
      backoff:  { type: 'exponential', delay: 3000 },
      removeOnComplete: { age: 3600, count: 1000 },   // keep Redis tidy
      removeOnFail:     { age: 86400, count: 1000 },
    },
  });
}

let queueSingleton;
function getAiQueue() {
  if (!queueSingleton) queueSingleton = createAiQueue();
  return queueSingleton;
}

async function enqueueGeneration(generationId, schoolId) {
  const queue = getAiQueue();
  return queue.add(
    'generate-ui',
    { generationId, schoolId },
    { jobId: generationId }
  );
}

module.exports = { QUEUE_NAME, enqueueGeneration, getAiQueue };