require('dotenv').config();
const pool = require('../config/db');

// Adds the two-provider (UnoRouter + Google Gemini) settings columns and
// migrates any old B.AI model values stored by the previous system:
//   settings.ai_provider   ('unorouter' | 'gemini') — Admin-selected provider
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

// The only valid model ids across both providers (see backend/ai/ai-models.js).
// Old B.AI ids (mimo-v2.5) and third-provider ids (:free suffixed) are invalid.
const VALID_MODELS = [
  'codestral-latest', 'qwen3.8-flash', 'glm-5.3-flash',
  'gemini-3.5-flash-lite', 'gpt-oss-20b', 'gemini-3.1-flash-lite',
];

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
      ADD COLUMN \`ai_provider\` VARCHAR(20) NOT NULL DEFAULT 'unorouter'
      COMMENT 'AI provider id used for judge UI generation (unorouter | gemini)'
      AFTER \`ai_prompt\``);
    console.log('✅ settings.ai_provider added.');
  } else {
    console.log('ℹ️  settings.ai_provider already exists.');
  }

  // Normalize existing provider values, then normalize any invalid/legacy
  // model ids (old B.AI ids, NULLs, third-provider :free ids) to the new
  // default. Prompts stay untouched.
  await pool.query(`UPDATE settings
    SET ai_provider = 'unorouter'
    WHERE ai_provider IS NULL OR TRIM(ai_provider) = ''`);
  console.log('ℹ️  settings.ai_provider normalized to unorouter.');

  await pool.query(
    `UPDATE settings
       SET ai_model = 'codestral-latest'
     WHERE ai_model IS NULL OR TRIM(ai_model) = ''
        OR LOWER(TRIM(ai_model)) NOT IN (${VALID_MODELS.map(() => '?').join(',')})`,
    VALID_MODELS.map((m) => m.toLowerCase())
  );
  console.log('ℹ️  settings.ai_model migrated to valid two-provider models.');

  // New rows now default to the new provider/model instead of the old B.AI id.
  await pool.query(`ALTER TABLE \`settings\`
    ALTER COLUMN \`ai_model\` SET DEFAULT 'codestral-latest'`);
  console.log('ℹ️  settings.ai_model default set to codestral-latest.');
}

async function main() {
  await withRetry(migrate);
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});