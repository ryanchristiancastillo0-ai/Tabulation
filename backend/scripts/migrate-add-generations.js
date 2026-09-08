require('dotenv').config();
const pool = require('../config/db');

// Adds the `generations` table — MySQL is the source of truth for AI generation
// job status (QUEUED / PROCESSING / COMPLETED / FAILED).
async function main() {
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
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});