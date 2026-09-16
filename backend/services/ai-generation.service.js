// ── AI generation records (MySQL is the source of truth for status) ──────────
// Statuses: QUEUED → PROCESSING → COMPLETED | FAILED.
// The generated UI itself lives in the existing ui_cache table (referenced by
// prompt_hash); this table only tracks the job lifecycle.

const crypto = require('crypto');
const pool = require('../config/db');
const HttpError = require('../utils/http-error');

const STATUS = {
  QUEUED:     'QUEUED',
  PROCESSING: 'PROCESSING',
  COMPLETED:  'COMPLETED',
  FAILED:     'FAILED',
};

async function createGeneration({ schoolId, prompt, model }) {
  const generationId = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO generations (id, school_id, prompt, model, status)
     VALUES (?, ?, ?, ?, ?)`,
    [generationId, schoolId, prompt, model || null, STATUS.QUEUED]
  );
  console.log(`📝 [genService] createGeneration id=${generationId} school=${schoolId} prompt="${prompt?.slice(0,60)}..." model=${model}`);
  return { id: generationId, status: STATUS.QUEUED };
}

async function getGeneration(id, schoolId) {
  const [rows] = await pool.execute(
    `SELECT g.id, g.school_id, g.status, g.prompt_hash, g.error,
            c.html_content AS result_html
       FROM generations g
       LEFT JOIN ui_cache c
              ON c.school_id = g.school_id AND c.prompt_hash = g.prompt_hash
      WHERE g.id = ?`,
    [id]
  );
  const gen = rows[0];
  if (!gen || String(gen.school_id) !== String(schoolId)) {
    throw new HttpError(404, 'Generation not found.');
  }

  const out = { id: gen.id, status: gen.status };
  if (gen.status === STATUS.COMPLETED) out.result = gen.result_html || null;
  if (gen.status === STATUS.FAILED)     out.error   = gen.error || 'AI generation failed.';
  console.log(`🔍 [genService] getGeneration id=${id} status=${gen.status} hasResultHtml=${!!gen.result_html} promptHash=${gen.prompt_hash?.slice(0,8)}`);
  return out;
}

async function markProcessing(id) {
  console.log(`🔄 [genService] markProcessing id=${id}`);
  await pool.execute(
    `UPDATE generations SET status = ?, started_at = NOW()
      WHERE id = ? AND status = ?`,
    [STATUS.PROCESSING, id, STATUS.QUEUED]
  );
}

async function markCompleted(id, promptHash) {
  console.log(`✅ [genService] markCompleted id=${id} promptHash=${promptHash?.slice(0,8)}`);
  await pool.execute(
    `UPDATE generations
        SET status = ?, prompt_hash = ?, error = NULL, completed_at = NOW()
      WHERE id = ?`,
    [STATUS.COMPLETED, promptHash, id]
  );
}

async function markFailed(id, safeError) {
  console.log(`❌ [genService] markFailed id=${id} error="${safeError}"`);
  await pool.execute(
    `UPDATE generations
        SET status = ?, error = ?, completed_at = NOW()
      WHERE id = ?`,
    [STATUS.FAILED, safeError, id]
  );
}

module.exports = {
  STATUS,
  createGeneration,
  getGeneration,
  markProcessing,
  markCompleted,
  markFailed,
};