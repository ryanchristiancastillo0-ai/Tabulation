require('dotenv').config();
const pool = require('./config/db');
(async () => {
  try {
    const [sett] = await pool.execute('SELECT ai_provider, ai_model, ui_mode, LEFT(ai_prompt,80) p, computation_type FROM settings WHERE school_id = 1 LIMIT 1');
    console.log('SETTINGS:', JSON.stringify(sett));
    const [caches] = await pool.execute('SELECT id, prompt_hash, LENGTH(html_content) len, LEFT(html_content, 160) head, FROM_UNIXTIME(updated_at/1000) u FROM ui_cache WHERE school_id = 1 ORDER BY id DESC LIMIT 1');
    console.log('\nLATEST UI_CACHE row:', JSON.stringify(caches, null, 1));
    if (caches[0]) {
      const h = caches[0].head || '';
      const hasNo = /<div class="overflow-x-auto w-full">/.test(h);
      console.log('Has AI wrapper?', hasNo);
    }
    const [sc] = await pool.execute('SELECT jud.age_id judge_id... FROM score_counts');
  } catch (e) { console.error('ERR', e.message); }
})();
