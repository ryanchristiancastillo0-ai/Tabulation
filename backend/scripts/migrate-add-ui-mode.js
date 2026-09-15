require('dotenv').config();
const pool = require('../config/db');

// Adds the judge UI mode column:
//   settings.ui_mode ('ai' | 'default')
//                         — 'ai'      = AI-generated judge UI (default)
//                         — 'default' = always use the standard deterministic
//                                       scoring table (no AI involved)
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
  if (!(await columnExists('settings', 'ui_mode'))) {
    await pool.query(`ALTER TABLE \`settings\`
      ADD COLUMN \`ui_mode\` VARCHAR(20) DEFAULT 'ai'
      COMMENT 'ai | default — ai=AI-generated judge UI, default=standard deterministic table'
      AFTER \`ai_model\``);
    console.log('✅ settings.ui_mode added.');
  } else {
    console.log('ℹ️  settings.ui_mode already exists.');
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