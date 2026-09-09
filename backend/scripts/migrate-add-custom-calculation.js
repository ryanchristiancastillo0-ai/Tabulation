require('dotenv').config();
const pool = require('../config/db');

// Adds the custom-calculation columns to `settings`:
//   custom_base      ('average' | 'rank')   — base calc for computation_type='custom'
//   tie_break_method ('midrank' | 'shared' | 'sequential') — tie handling for custom mode
async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].n > 0;
}

async function main() {
  if (!(await columnExists('settings', 'custom_base'))) {
    await pool.query(`ALTER TABLE \`settings\`
      ADD COLUMN \`custom_base\` VARCHAR(20) DEFAULT 'average'
      COMMENT 'average or rank; used when computation_type=custom'
      AFTER \`computation_type\``);
    console.log('✅ settings.custom_base added.');
  } else {
    console.log('ℹ️  settings.custom_base already exists.');
  }

  if (!(await columnExists('settings', 'tie_break_method'))) {
    await pool.query(`ALTER TABLE \`settings\`
      ADD COLUMN \`tie_break_method\` VARCHAR(20) DEFAULT 'midrank'
      COMMENT 'midrank, shared, or sequential; used when computation_type=custom'
      AFTER \`custom_base\``);
    console.log('✅ settings.tie_break_method added.');
  } else {
    console.log('ℹ️  settings.tie_break_method already exists.');
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});