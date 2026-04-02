const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../config/db');
const { generateWithFallback } = require('../config/ai');

// ── 1. GENERATE AI JUDGE UI ──
router.post('/render-ui', async (req, res) => {
    try {
        const { contestants, criteria, aiPrompt: incomingPrompt } = req.body;
          
        const [rows] = await pool.execute("SELECT contest_name, ai_prompt FROM settings WHERE id = 1");
        const settings = rows[0] || { contest_name: "Event", ai_prompt: "Modern and Professional" };
        const finalDesignGoal = incomingPrompt || settings.ai_prompt || "Modern and Professional";

        const configHash = crypto.createHash('md5')
            .update(finalDesignGoal + JSON.stringify(criteria))
            .digest('hex');

        const [cache] = await pool.execute("SELECT header_content, html_content FROM ui_cache WHERE prompt_hash = ?", [configHash]);

        if (cache.length > 0) {
            return res.json({ 
                headerHtml: cache[0].header_content, 
                html: cache[0].html_content 
            });
        }

        // PROMPT 1: THE TABLE (Now with strict color enforcement)
      const aiInstruction = `
            Act as a Senior Tailwind Developer.
            [THEME]: "${finalDesignGoal}"
            [COLOR SCHEME]: 
            - If theme is "${finalDesignGoal}", the table background, borders, and rows MUST use that color palette.
            - DO NOT use white (bg-white) for the table or rows if the theme is a specific color (like Pink).
            - Use shades like ${finalDesignGoal}-50 for rows and ${finalDesignGoal}-100 for borders.

            [CONTEXT]:
            - Contest: ${settings.contest_name}
            - Data: ${JSON.stringify(contestants.map(c => ({id: c.id, n: c.name, num: c.entry_number})))}
            - Criteria: ${JSON.stringify(criteria.map(cr => ({id: cr.id, name: cr.name, percentage: cr.percentage})))}

            [MANDATORY]:
            - Render EXACTLY ${contestants.length} rows. 
            - Columns: No., Name, ${criteria.map(c => `${c.name} (${c.percentage}%)`).join(", ")}, Total, Rank.
            - Each criteria column header MUST show the name AND percentage like: "Performance (60%)"
            - Dropdowns: class="score-dropdown" id="score-{cId}-{crId}"
            - Totals: id="total-{cId}" 
            - Ranks: id="rank-{cId}"

            [OUTPUT]: Return ONLY a <div> containing the Tailwind-styled <table>. No markdown.
        `;

        // PROMPT 2: THE CRITERIA HEADER
        const criteriaInstruction = `
            Act as a Senior UI Designer.
            [THEME]: "${finalDesignGoal}"
            [TASK]: Create a criteria percentage summary section.
            [STYLE]: Use Tailwind. Ensure the background <div> matches the "${finalDesignGoal}" theme perfectly.
            [OUTPUT]: Return ONLY the HTML <div>. No markdown.
        `;

        const [tableHTML, headerHTML] = await Promise.all([
            generateWithFallback(aiInstruction),
            generateWithFallback(criteriaInstruction)
        ]);

        const cleanTable = tableHTML.replace(/```html/g, "").replace(/```/g, "").trim();
        const cleanHeader = headerHTML.replace(/```html/g, "").replace(/```/g, "").trim();

        await pool.execute(
            "INSERT INTO ui_cache (prompt_hash, header_content, html_content) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE header_content = VALUES(header_content), html_content = VALUES(html_content)",
            [configHash, cleanHeader, cleanTable]
        );

        res.json({ headerHtml: cleanHeader, html: cleanTable });
    } catch (err) {
        res.status(500).json({ error: "Failed" });
    }
});
// ── 2. SUBMIT JUDGE SCORES ──
router.post('/submit', async (req, res) => {
    try {
        const { judgeId, scores } = req.body;
        if (!judgeId || !scores) return res.status(400).json({ error: "Missing Judge ID or Scores" });

        // Use a transaction for safer batch inserts
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const sql = `INSERT INTO scores (judge_id, contestant_id, criterion_id, score_value) 
                         VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE score_value = VALUES(score_value)`;

            for (const s of scores) {
                await connection.execute(sql, [judgeId, s.contestantId, s.criterionId, s.value]);
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

// ── 3. GET SCORE SUMMARY (RANKINGS) ──
router.get('/my-scores', async (req, res) => {
    try {
        const { judgeId } = req.query;
        if (!judgeId) return res.status(400).json({ error: "Judge ID is required" });

        const sql = `
            SELECT c.name, SUM(s.score_value) as total 
            FROM scores s
            JOIN contestants c ON s.contestant_id = c.id
            WHERE s.judge_id = ?
            GROUP BY c.id, c.name
            ORDER BY total DESC
        `;
        const [rankings] = await pool.execute(sql, [judgeId]);
        res.json(rankings);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch rankings" });
    }
});

// ── 4. GET RAW SCORES FOR UI PERSISTENCE ──
router.get('/my-scores-raw/:judgeId', async (req, res) => {
    try {
        const { judgeId } = req.params;
        const [scores] = await pool.execute(
            "SELECT contestant_id, criterion_id, score_value FROM scores WHERE judge_id = ?", 
            [judgeId]
        );
        res.json(scores);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch raw scores" });
    }
});

module.exports = router;