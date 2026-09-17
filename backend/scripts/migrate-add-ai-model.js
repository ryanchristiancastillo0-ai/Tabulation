require('dotenv').config();
const pool = require('../config/db');

// Adds the B.AI model columns:
//   settings.ai_model       (e.g. 'openai/gpt-oss-120b')
//                           — Admin-selected model for judge UI generation
//   generations.model       — the model used for each AI generation job
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].n > 0;
}

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
  if (!(await columnExists('settings', 'ai_model'))) {
    await pool.query(`ALTER TABLE \`settings\`
      ADD COLUMN \`ai_model\` VARCHAR(50) DEFAULT '${DEFAULT_MODEL}'
      COMMENT 'AI model id used for judge UI generation'
      AFTER \`ai_prompt\``);
    console.log('✅ settings.ai_model added.');
  } else {
    console.log('ℹ️  settings.ai_model already exists.');
  }

  if (!(await columnExists('generations', 'model'))) {
    await pool.query(`ALTER TABLE \`generations\`
      ADD COLUMN \`model\` VARCHAR(50) DEFAULT '${DEFAULT_MODEL}'
      COMMENT 'AI model id used for this generation'
      AFTER \`prompt\``);
    console.log('✅ generations.model added.');
  } else {
    console.log('ℹ️  generations.model already exists.');
  }
}

async function main() {
  await withRetry(migrate);
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});