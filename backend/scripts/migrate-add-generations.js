require('dotenv').config();
const pool = require('../config/db');

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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`generations\` (
      \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
      \`school_id\` INT NOT NULL,
      \`prompt\` TEXT NOT NULL COMMENT 'AI design goal used for generation',
      \`status\` ENUM('QUEUED','PROCESSING','COMPLETED','FAILED') NOT NULL DEFAULT 'QUEUED',
      \`prompt_hash\` VARCHAR(32) DEFAULT NULL COMMENT 'links to the result in ui_cache',
      \`error\` TEXT DEFAULT NULL COMMENT 'safe, user-facing failure message',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`started_at\` TIMESTAMP NULL DEFAULT NULL,
      \`completed_at\` TIMESTAMP NULL DEFAULT NULL,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY \`school_id\` (\`school_id\`),
      CONSTRAINT \`fk_generations_school\` FOREIGN KEY (\`school_id\`) REFERENCES \`schools\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ generations table ready.');
}

async function main() {
  await withRetry(migrate);
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});