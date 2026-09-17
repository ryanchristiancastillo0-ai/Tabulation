require('dotenv').config();
const pool = require('../config/db');

// Ensures the provider/model settings columns exist and normalizes stored
// values to the three-provider reality (Groq + Google Gemini + OpenRouter):
//   settings.ai_provider   ('groq' | 'gemini' | 'openrouter')
//   settings.ai_model      — migrated to a valid provider model
// Existing saved prompts are NEVER touched.
async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].n > 0;
}

// Valid model ids across the three providers (see backend/ai/ai-models.js).
const VALID_MODELS = [
  'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b',
  'gemini-3.1-flash-lite', 'openrouter/free',
];

const DEFAULT_MODEL = 'openai/gpt-oss-120b';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Managed MySQL (Aiven) can drop a connect attempt intermittently. These
// migrations are idempotent, so just retry the whole run with backoff.
async function withRetry(fn, attempts = 6) {
  let lastErr;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      console.warn(`⚠️  Connection attempt ${i}/${attempts} failed (${err.code || err.message}) — retrying in ${i * 2000}ms…`);
      await sleep(i * 2000);
    }
  }
  throw lastErr;
}

async function migrate() {
  if (!(await columnExists('settings', 'ai_provider'))) {
    await pool.query(`ALTER TABLE \`settings\`
      ADD COLUMN \`ai_provider\` VARCHAR(20) NOT NULL DEFAULT 'groq'
      COMMENT 'AI provider id used for judge UI generation (groq | gemini | openrouter)'
      AFTER \`ai_prompt\``);
    console.log('✅ settings.ai_provider added.');
  } else {
    console.log('ℹ️  settings.ai_provider already exists.');
  }

  // Normalize existing provider values: empty/NULL → 'groq', and the removed
  // legacy 'unorouter' id → 'groq'. Prompts stay untouched.
  await pool.query(`UPDATE settings
    SET ai_provider = 'groq'
    WHERE ai_provider IS NULL OR TRIM(ai_provider) = '' OR LOWER(TRIM(ai_provider)) = 'unorouter'`);
  console.log('ℹ️  settings.ai_provider normalized to groq.');

  await pool.query(
    `UPDATE settings
       SET ai_model = ?
     WHERE ai_model IS NULL OR TRIM(ai_model) = ''
        OR LOWER(TRIM(ai_model)) NOT IN (${VALID_MODELS.map(() => '?').join(',')})`,
    [DEFAULT_MODEL, ...VALID_MODELS.map((m) => m.toLowerCase())]
  );
  console.log('ℹ️  settings.ai_model migrated to valid provider models.');

  // New rows now default to the new provider/model instead of legacy ids.
  await pool.query(`ALTER TABLE \`settings\`
    ALTER COLUMN \`ai_provider\` SET DEFAULT 'groq'`);
  await pool.query(`ALTER TABLE \`settings\`
    ALTER COLUMN \`ai_model\` SET DEFAULT ?`, [DEFAULT_MODEL]);
  console.log('ℹ️  settings defaults set to groq / openai-gpt-oss-120b.');
}

async function main() {
  await withRetry(migrate);
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});