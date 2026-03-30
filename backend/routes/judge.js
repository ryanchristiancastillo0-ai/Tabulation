const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../config/db');
const { generateWithFallback } = require('../config/ai');

// POST generate AI judge UI
router.post('/render-ui', async (req, res) => {
    try {
        const { contestants, criteria, aiPrompt: incomingPrompt } = req.body;

        const [rows] = await pool.execute("SELECT contest_name, ai_prompt FROM settings WHERE id = 1");
        const settings = rows[0] || { contest_name: "Event", ai_prompt: "Modern and Professional" };

        const finalDesignGoal = incomingPrompt || settings.ai_prompt || "Modern and Professional";

        const configHash = crypto.createHash('md5')
            .update(finalDesignGoal + JSON.stringify(criteria))
            .digest('hex');

        const [cache] = await pool.execute("SELECT html_content FROM ui_cache WHERE prompt_hash = ?", [configHash]);

        if (cache.length > 0) {
            console.log("🚀 Serving UI from Database Cache (Internet Independent)");
            return res.json({ html: cache[0].html_content });
        }

        console.log("🌐 Cache miss. Generating fresh UI from AI...");

        const aiInstruction = `
    Act as a Senior Full-Stack Developer. 
    [THEME]: "${finalDesignGoal}"
    [STYLE]: Use INLINE STYLES. NO White Backgrounds. Modern Professional aesthetic. Use dark-friendly colors.

    [DATA]:
    Contest: ${settings.contest_name}
    Contestants: ${JSON.stringify(contestants)}
    Criteria: ${JSON.stringify(criteria)}

    [STRUCTURE]:
    1. Create ONE <table> for "${settings.contest_name}".
    2. Columns: "No.", "Name", ${criteria.map(c => `"${c.name}"`).join(", ")}, "Total Score", "Rank".

    [REACT BRIDGE RULES - MANDATORY]:
    - Every score <select> must have id="score-{contestantId}-{criterionId}" 
    - The {criterionId} MUST match the ID from the Criteria Data provided.
    - Class must be "score-dropdown".
    - Total score cell must have id="total-{contestantId}" and start at 0.
    - Rank cell must have id="rank-{contestantId}" and start as "--".

    [TECHNICAL]:
    - Return ONLY the <div> containing the table.
    - Ensure the Table has a clean border-collapse and padding for readability.
`;
        const html = await generateWithFallback(aiInstruction);
        const cleanHTML = html.replace(/```html/g, "").replace(/```/g, "").trim();

        await pool.execute(
            "INSERT INTO ui_cache (prompt_hash, html_content) VALUES (?, ?) ON DUPLICATE KEY UPDATE html_content = VALUES(html_content)",
            [configHash, cleanHTML]
        );

        res.json({ html: cleanHTML });
    } catch (err) {
        console.error("AI UI Generation Error:", err.message);
        res.status(500).json({ error: "Failed to generate AI Interface" });
    }
});

// POST submit judge scores
router.post('/submit', async (req, res) => {
    try {
        const { judgeId, scores } = req.body;
        if (!judgeId || !scores) return res.status(400).json({ error: "Missing Judge ID or Scores" });

        const sql = `INSERT INTO scores (judge_id, contestant_id, criterion_id, score_value) 
                     VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE score_value = VALUES(score_value)`;

        for (const s of scores) {
            await pool.execute(sql, [judgeId, s.contestantId, s.criterionId, s.value]);
        }
        res.json({ success: true, message: "Scores successfully saved to database" });
    } catch (err) {
        console.error("Submission Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET judge's own score summary
router.get('/my-scores', async (req, res) => {
    try {
        const { judgeId } = req.query;

        if (!judgeId) {
            return res.status(400).json({ error: "Judge ID is required" });
        }

        const sql = `
            SELECT 
                c.name, 
                SUM(s.score_value) as total 
            FROM scores s
            JOIN contestants c ON s.contestant_id = c.id
            WHERE s.judge_id = ?
            GROUP BY c.id, c.name
            ORDER BY total DESC
        `;

        const [rankings] = await pool.execute(sql, [judgeId]);
        res.json(rankings);
    } catch (err) {
        console.error("Scoreboard Fetch Error:", err.message);
        res.status(500).json({ error: "Failed to fetch judge rankings" });
    }
});

module.exports = router;
