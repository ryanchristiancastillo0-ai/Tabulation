require('dotenv').config();
const pool = require('../config/db');

// Adds the `fullscreen_config` table — per-school leaderboard fullscreen display
// customization (colors + title/subtitle).
async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`fullscreen_config\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`school_id\` INT NOT NULL UNIQUE,
      \`bg_color\` VARCHAR(7) DEFAULT '#1B4332',
      \`accent_color\` VARCHAR(7) DEFAULT '#1B4332',
      \`text_color\` VARCHAR(7) DEFAULT '#ffffff',
      \`title_text\` VARCHAR(255) DEFAULT '',
      \`subtitle_text\` VARCHAR(255) DEFAULT '',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_fullscreen_config_school\` FOREIGN KEY (\`school_id\`) REFERENCES \`schools\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ fullscreen_config table ready.');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});