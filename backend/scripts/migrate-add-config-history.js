require('dotenv').config();
const pool = require('../config/db');

// Adds the config_history table — a per-save audit snapshot of the admin's
// contest configuration:
//   - settings (contest name, judges, ui mode, ai provider/model, calc mode…)
//   - the contestant + criteria lists at save time
//   - the ui_cache design already stored for this save ('ai' | 'default').
// The admin can inspect, view, and delete entries from the History page.

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

async function tableExists(table) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [table]
  );
  return rows[0].n > 0;
}

async function migrate() {
  if (await tableExists('config_history')) {
    console.log('ℹ️  config_history already exists.');
    return;
  }

  await pool.query(`
    CREATE TABLE \`config_history\` (
      \`id\` BIGINT NOT NULL AUTO_INCREMENT,
      \`school_id\` INT NOT NULL,
      \`contest_name\` VARCHAR(255) DEFAULT NULL COMMENT 'contest name at save time',
      \`judge_count\` INT DEFAULT NULL COMMENT 'judge count at save time',
      \`ui_mode\` VARCHAR(20) DEFAULT NULL COMMENT 'configured judge UI mode at save time: ai|default',
      \`design_type\` ENUM('ai','default') DEFAULT NULL COMMENT 'ui_cache design stored for this save',
      \`prompt_hash\` VARCHAR(32) DEFAULT NULL COMMENT 'links to the matching ui_cache row',
      \`computation_type\` VARCHAR(20) DEFAULT NULL COMMENT 'average|rank|custom at save time',
      \`tie_break_method\` VARCHAR(20) DEFAULT NULL COMMENT 'midrank|shared|sequential at save time',
      \`snapshot\` JSON DEFAULT NULL COMMENT 'full settings + criteria + contestants snapshot for this save',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`school_id\` (\`school_id\`),
      KEY \`created_at\` (\`created_at\`),
      CONSTRAINT \`fk_config_history_school\` FOREIGN KEY (\`school_id\`) REFERENCES \`schools\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ config_history table ready.');
}

async function main() {
  await withRetry(migrate);
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});