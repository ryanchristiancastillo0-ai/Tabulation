require('dotenv').config();
const pool = require('../config/db');

// Adds the ui_cache design-type column:
//   ui_cache.design_type ENUM('ai','default')
//                         — 'ai'      = AI-generated judge UI design (prompt-driven)
//                         — 'default' = standard deterministic scoring table (no AI)
// Existing rows are classified by content: rows carrying the static-table
// markers (sts-shell / sts-table-wrap) are default designs; everything else is
// treated as an AI design. Idempotent — safe to re-run.
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
  if (!(await columnExists('ui_cache', 'design_type'))) {
    await pool.query(`ALTER TABLE \`ui_cache\`
      ADD COLUMN \`design_type\` ENUM('ai','default') NOT NULL DEFAULT 'default'
      COMMENT 'ai = AI-generated judge UI, default = standard deterministic table'
      AFTER \`school_id\``);
    console.log('✅ ui_cache.design_type column added.');

    // Backfill existing rows: static-table rows are default designs, all other
    // rows (AI-styled content) are AI designs.
    await pool.query(
      `UPDATE ui_cache
          SET design_type = 'default'
        WHERE html_content LIKE '%sts-table-wrap%'
           OR html_content LIKE '%sts-shell%'`
    );
    await pool.query(
      `UPDATE ui_cache
          SET design_type = 'ai'
        WHERE design_type = 'default'
          AND html_content NOT LIKE '%sts-table-wrap%'
          AND html_content NOT LIKE '%sts-shell%'`
    );
    console.log('✅ ui_cache.design_type backfilled from row content.');
  } else {
    console.log('ℹ️  ui_cache.design_type already exists.');
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