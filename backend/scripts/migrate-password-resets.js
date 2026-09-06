require('dotenv').config();
const pool = require('../config/db');

async function main() {
  const [result] = await pool.query(`
    CREATE TABLE IF NOT EXISTS \`password_resets\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`admin_id\` INT NOT NULL,
      \`email\` VARCHAR(255) NOT NULL,
      \`code_hash\` VARCHAR(255) NOT NULL,
      \`attempts\` INT DEFAULT 0 COMMENT 'Failed verification attempts',
      \`expires_at\` DATETIME NOT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY \`admin_id\` (\`admin_id\`),
      KEY \`email\` (\`email\`),
      CONSTRAINT \`fk_password_resets_admin\` FOREIGN KEY (\`admin_id\`) REFERENCES \`admins\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('password_resets table ready:', result);
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});