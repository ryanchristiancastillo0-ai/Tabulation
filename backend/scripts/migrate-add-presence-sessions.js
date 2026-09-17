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
    CREATE TABLE IF NOT EXISTS \`sessions\` (
      \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      \`school_id\` INT NOT NULL,
      \`actor_type\` ENUM('admin','judge') NOT NULL COMMENT 'who owns this device session',
      \`actor_id\` INT NOT NULL COMMENT 'admins.id for admins, schools.id for judges',
      \`device_id\` CHAR(36) NOT NULL COMMENT 'opaque per-device id; embedded in access JWTs',
      \`refresh_hash\` CHAR(64) DEFAULT NULL COMMENT 'sha256 of the opaque 7-day refresh token',
      \`last_seen\` DATETIME NOT NULL COMMENT 'presence heartbeat — drives online/offline status',
      \`expires_at\` DATETIME NOT NULL COMMENT 'refresh-token expiry (login + 7 days)',
      \`logged_out_at\` DATETIME NULL DEFAULT NULL COMMENT 'set when the user signs out from this device',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY \`uq_sessions_device\` (\`device_id\`),
      KEY \`idx_sessions_school_presence\` (\`school_id\`, \`logged_out_at\`, \`last_seen\`),
      KEY \`idx_sessions_refresh\` (\`refresh_hash\`),
      CONSTRAINT \`fk_sessions_school\` FOREIGN KEY (\`school_id\`) REFERENCES \`schools\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ sessions table ready.');
}

async function main() {
  await withRetry(migrate);
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});