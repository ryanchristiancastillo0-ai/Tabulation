const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../config/db');
const { generateWithFallback } = require('../config/ai');

// ── 1. GENERATE AI JUDGE UI (PUBLIC - no auth) ──
// NOTE: headerHtml (criteria summary) is no longer AI-generated.
// The frontend renders it statically from config.criteria.
// Only the scoring TABLE is AI-generated here to save tokens.
router.post('/render-ui', async (req, res) => {
    try {
        const { contestants, criteria, aiPrompt: incomingPrompt, school_id } = req.body;

        if (!school_id) return res.status(400).json({ error: 'school_id is required.' });
        if (!contestants?.length || !criteria?.length) {
            return res.status(400).json({ error: 'contestants and criteria are required.' });
        }

        const [rows] = await pool.execute(
            "SELECT contest_name, ai_prompt FROM settings WHERE school_id = ? LIMIT 1",
            [school_id]
        );
        const settings = rows[0] || { contest_name: "Event", ai_prompt: "Modern and Professional" };
        const finalDesignGoal = incomingPrompt || settings.ai_prompt || "Modern and Professional";

        const configHash = crypto.createHash('md5')
            .update(finalDesignGoal + JSON.stringify(criteria) + String(school_id))
            .digest('hex');

        const [cache] = await pool.execute(
            "SELECT html_content FROM ui_cache WHERE prompt_hash = ? AND school_id = ?",
            [configHash, school_id]
        );

        if (cache.length > 0) {
            return res.json({
                html: cache[0].html_content,
                // headerHtml intentionally omitted — frontend renders criteria statically
            });
        }

        const aiInstruction = `
    Act as a Senior Tailwind Developer.
    [THEME]: "${finalDesignGoal}"

    [COLOR SCHEME]:
    - Derive a Tailwind color palette from the theme name.
    - Dark themes (navy, charcoal, dark): use bg-gray-900 or bg-slate-900 for surfaces.
    - Gold accent = use yellow-400 or amber-400 for text and borders.
    - Light themes: use bg-gray-50 surfaces with gray-900 text.

    [FORM ELEMENT RULES — CRITICAL]:
    - Every <select> must use Tailwind classes only — NO inline styles.
    - The bg class on <select> MUST match the table/surface bg (e.g. bg-slate-900).
    - The text class must contrast strongly (e.g. text-yellow-400 on bg-slate-900).
    - Example for dark navy + gold:
        <select class="score-dropdown bg-slate-900 text-yellow-400 border border-yellow-400 rounded px-2 py-1" id="score-{cId}-{crId}">
          <option class="bg-slate-900 text-yellow-400">95</option>
        </select>
    - Example for light theme:
        <select class="score-dropdown bg-gray-50 text-gray-900 border border-gray-300 rounded px-2 py-1">
          <option class="bg-gray-50 text-gray-900">95</option>
        </select>
    - ALWAYS add the same bg and text classes to every <option> — browsers ignore parent styles on options.

    [CONTEXT]:
    - Contest: ${settings.contest_name}
    - Data: ${JSON.stringify(contestants.map(c => ({ id: c.id, n: c.name, num: c.entry_number })))}
    - Criteria: ${JSON.stringify(criteria.map(cr => ({ id: cr.id, name: cr.name, percentage: cr.percentage })))}

    [MANDATORY]:
    - Render EXACTLY ${contestants.length} rows.
    - Columns: No., Name, ${criteria.map(c => `${c.name} (${c.percentage}%)`).join(", ")}, Total, Rank.
    - Each criteria column header MUST show name AND percentage: "Performance (60%)"
    - Dropdowns: class="score-dropdown ..." id="score-{cId}-{crId}"
    - Totals: id="total-{cId}"
    - Ranks: id="rank-{cId}"

    [OUTPUT]: Return ONLY a <div> with a Tailwind <table>. No markdown.
`;

        const tableHTML = await generateWithFallback(aiInstruction);
        const cleanTable = tableHTML.replace(/```html/g, "").replace(/```/g, "").trim();

        await pool.execute(
            `INSERT INTO ui_cache (prompt_hash, school_id, html_content) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
               html_content = VALUES(html_content)`,
            [configHash, school_id, cleanTable]
        );

        res.json({
            html: cleanTable,
            // headerHtml intentionally omitted — frontend renders criteria statically
        });

    } catch (err) {
        console.error('render-ui error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── 2. SUBMIT JUDGE SCORES (PUBLIC - judges have no JWT) ──
router.post('/submit', async (req, res) => {
    try {
        const { judgeId, scores, school_id } = req.body;

        if (!judgeId || !scores)   return res.status(400).json({ error: "Missing Judge ID or Scores" });
        if (!school_id)            return res.status(400).json({ error: "Missing school_id" });
        if (!Array.isArray(scores) || scores.length === 0) {
            return res.status(400).json({ error: "Scores array is empty" });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const sql = `
                INSERT INTO scores (school_id, judge_id, contestant_id, criterion_id, score_value) 
                VALUES (?, ?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE score_value = VALUES(score_value)
            `;
            for (const s of scores) {
                await connection.execute(sql, [school_id, judgeId, s.contestantId, s.criterionId, s.value]);
            }
            await connection.commit();
            res.json({ success: true, message: "Scores successfully saved" });
        } catch (dbErr) {
            await connection.rollback();
            throw dbErr;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error("Submission Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── 3. GET SCORE SUMMARY (PUBLIC) ──
router.get('/my-scores', async (req, res) => {
    try {
        const { judgeId, school_id } = req.query;
        if (!judgeId)   return res.status(400).json({ error: "Judge ID is required" });
        if (!school_id) return res.status(400).json({ error: "school_id is required" });

        const [rankings] = await pool.execute(
            `SELECT c.name, SUM(s.score_value) as total 
             FROM scores s
             JOIN contestants c ON s.contestant_id = c.id AND c.school_id = ?
             WHERE s.judge_id = ? AND s.school_id = ?
             GROUP BY c.id, c.name
             ORDER BY total DESC`,
            [school_id, judgeId, school_id]
        );
        res.json(rankings);
    } catch (err) {
        console.error('my-scores error:', err.message);
        res.status(500).json({ error: "Failed to fetch rankings" });
    }
});

// ── 4. GET RAW SCORES FOR UI PERSISTENCE (PUBLIC) ──
router.get('/my-scores-raw/:judgeId', async (req, res) => {
    try {
        const { judgeId } = req.params;
        const { school_id } = req.query;
        if (!school_id) return res.status(400).json({ error: "school_id is required" });

        const [scores] = await pool.execute(
            `SELECT contestant_id, criterion_id, score_value 
             FROM scores 
             WHERE judge_id = ? AND school_id = ?`,
            [judgeId, school_id]
        );
        res.json(scores);
    } catch (err) {
        console.error('my-scores-raw error:', err.message);
        res.status(500).json({ error: "Failed to fetch raw scores" });
    }
});

// ── 5. GET CACHED UI ONLY — no AI, safe for background refresh ──
router.get('/render-ui-cached', async (req, res) => {
    try {
        const { school_id, criteria_signature } = req.query;
        if (!school_id) return res.status(400).json({ error: 'school_id is required.' });

        const [rows] = await pool.execute(
            "SELECT ai_prompt FROM settings WHERE school_id = ? LIMIT 1",
            [school_id]
        );
        const aiPrompt = rows[0]?.ai_prompt || 'Modern and Professional';

        const configHash = require('crypto')
            .createHash('md5')
            .update(aiPrompt + criteria_signature + String(school_id))
            .digest('hex');

        const [cache] = await pool.execute(
            "SELECT html_content FROM ui_cache WHERE prompt_hash = ? AND school_id = ?",
            [configHash, school_id]
        );

        if (cache.length > 0) {
            return res.json({
                html:      cache[0].html_content,
                fromCache: true,
                // headerHtml intentionally omitted — frontend renders criteria statically
            });
        }

        // Nothing in DB — tell the client to do a full POST instead
        return res.json({ fromCache: false });

    } catch (err) {
        console.error('render-ui-cached error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;