require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('crypto'); // Built-in for hashing

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'tabulation_db',
    waitForConnections: true,
    connectionLimit: 10
});

const MODEL_CHAIN = ["gemini-3.1-flash-lite-preview", "gemini-2.5-flash"];

async function generateWithFallback(prompt) {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) throw new Error("GEMINI_API_KEY is missing in .env");

    for (const modelName of MODEL_CHAIN) {
        try {
            console.log(`🔄 AI Requesting Model: ${modelName}...`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            const data = await response.json();

            if (!response.ok) {
                console.warn(` ${modelName} failed: ${data.error?.message || response.status}`);
                continue;
            }

            if (!data.candidates || data.candidates.length === 0) {
                console.warn(` ${modelName} returned no content (Safety Block).`);
                continue;
            }

            return data.candidates[0].content.parts[0].text;
        } catch (err) {
            console.error(`❌ System Error with ${modelName}:`, err.message);
        }
    }
    throw new Error("AI failed to respond. All models in chain exhausted.");
}

app.get('/api/get-all-data', async (req, res) => {
    try {
        const [settings] = await pool.execute("SELECT * FROM settings WHERE id = 1");
        const [contestants] = await pool.execute("SELECT * FROM contestants ORDER BY entry_number ASC");
        const [criteria] = await pool.execute("SELECT * FROM criteria");
        res.json({
            settings: settings[0] || { contest_name: "Event", judge_count: 3 },
            contestants,
            criteria
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/leaderboard', async (req, res) => {
    try {
        const [settings] = await pool.execute("SELECT computation_type, judge_count FROM settings WHERE id = 1");
        const type = settings[0].computation_type;

        // Get all scores joined with contestant names
        const [rawScores] = await pool.execute(`
            SELECT judge_id, contestant_id, c.name, SUM(score_value) as judge_total
            FROM scores s
            JOIN contestants c ON s.contestant_id = c.id
            GROUP BY judge_id, contestant_id
        `);

        if (type === 'average') {
            // AVERAGE LOGIC: Simple group and sum
            const [results] = await pool.execute(`
                SELECT c.name, SUM(s.score_value) / ? as final_score
                FROM scores s
                JOIN contestants c ON s.contestant_id = c.id
                GROUP BY c.id ORDER BY final_score DESC
            `, [settings[0].judge_count]);
            return res.json(results);
        } else {
            // RANK/PLACE LOGIC: 
            // 1. Group by judge to see how each judge ranked everyone
            const judgeRanks = {}; 
            rawScores.forEach(s => {
                if (!judgeRanks[s.judge_id]) judgeRanks[s.judge_id] = [];
                judgeRanks[s.judge_id].push(s);
            });

            const finalTallies = {};

            // 2. Convert scores to ranks for each judge
            Object.values(judgeRanks).forEach(scores => {
                scores.sort((a, b) => b.judge_total - a.judge_total);
                scores.forEach((s, index) => {
                    const rank = index + 1; // 1st, 2nd, 3rd...
                    if (!finalTallies[s.contestant_id]) {
                        finalTallies[s.contestant_id] = { name: s.name, total_rank: 0 };
                    }
                    finalTallies[s.contestant_id].total_rank += rank;
                });
            });

            // 3. Sort by LOWEST rank sum (1st + 1st = 2, which beats 2nd + 2nd = 4)
            const result = Object.values(finalTallies).sort((a, b) => a.total_rank - b.total_rank);
            return res.json(result);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ── RESET SYSTEM DATA ──
app.delete('/api/reset-data', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // Use a transaction to ensure all-or-nothing deletion
        await connection.beginTransaction();

        console.log("⚠️ Starting System Reset...");

        // 1. Clear Scores (Child table)
        await connection.execute("DELETE FROM scores");

        // 2. Clear UI Cache (AI generated UI)
        await connection.execute("DELETE FROM ui_cache");

        // 3. Clear Contestants
        await connection.execute("DELETE FROM contestants");

        // 4. Clear Criteria
        await connection.execute("DELETE FROM criteria");

        // 5. Optional: Reset Settings to defaults
        await connection.execute(`
            UPDATE settings 
            SET contest_name = '', 
                judge_count = 3, 
                ai_prompt = 'Modern and Professional' 
            WHERE id = 1
        `);

        await connection.commit();
        console.log("✅ Database Reset Successfully.");
        res.json({ success: true, message: "All data has been cleared." });

    } catch (err) {
        await connection.rollback();
        console.error("❌ Reset Error:", err.message);
        res.status(500).json({ error: "Failed to reset database: " + err.message });
    } finally {
        connection.release();
    }
});

// --- UPDATED ROUTE WITH DATABASE CACHING ---
app.post('/api/judge/render-ui', async (req, res) => {
    try {
        const { contestants, criteria, aiPrompt: incomingPrompt } = req.body;

        const [rows] = await pool.execute("SELECT contest_name, ai_prompt FROM settings WHERE id = 1");
        const settings = rows[0] || { contest_name: "Event", ai_prompt: "Modern and Professional" };

        const finalDesignGoal = incomingPrompt || settings.ai_prompt || "Modern and Professional";

        // Create a unique hash based on the design goal and criteria structure
        const configHash = crypto.createHash('md5')
            .update(finalDesignGoal + JSON.stringify(criteria))
            .digest('hex');

        // 1. CHECK DATABASE CACHE (Offline Support)
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
    - Every score <select> must have id="score-{contestantId}-{criterionId}" and class="score-dropdown".
    - Total score cell must have id="total-{contestantId}" and start at 0.
    - NEW: Rank cell must have id="rank-{contestantId}" and start as "--".

    [TECHNICAL]:
    - Return ONLY the <div> containing the table.
    - NO markdown. No code blocks. No headers.
    - Ensure the Table has a clean border-collapse and padding for readability.
`;

        const html = await generateWithFallback(aiInstruction);
        const cleanHTML = html.replace(/```html/g, "").replace(/```/g, "").trim();

        // 2. SAVE TO DATABASE FOR FUTURE USE
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

app.post('/api/save-config', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // MATCH THESE EXACTLY WITH THE FRONTEND PAYLOAD
        const { 
            contest_name, 
            
            judge_count, 
            ai_prompt, 
            contestants, 
            criteria, 
            computation_type,
            contest_type
        } = req.body;

        await connection.beginTransaction();

        // 1. Update General Settings
        // Use ?? || fallback to prevent 'undefined' from hitting the DB
        const updateSettingsSql = `
            UPDATE settings 
            SET contest_name = ?, contest_type = ?, judge_count = ?, ai_prompt = ?, computation_type = ? 
            WHERE id = 1
        `;
        await connection.execute(updateSettingsSql, [
            contest_name || '', 
            contest_type || 'pageant',
            judge_count || 3, 
            ai_prompt || '', 
            computation_type || 'average'
        ]);

        // 2. Refresh Contestants
        await connection.execute("DELETE FROM contestants");
        if (contestants && contestants.length > 0) {
            const contestantSql = "INSERT INTO contestants (name, entry_number) VALUES (?, ?)";
            for (const c of contestants) {
                // Ensure values aren't undefined
                await connection.execute(contestantSql, [c.name || 'Unnamed', c.entry_number || 0]);
            }
        }

        // 3. Refresh Criteria
        await connection.execute("DELETE FROM criteria");
        if (criteria && criteria.length > 0) {
            const criteriaSql = "INSERT INTO criteria (name, percentage) VALUES (?, ?)";
            for (const cr of criteria) {
                await connection.execute(criteriaSql, [cr.name || 'New Criteria', cr.percentage || 0]);
            }
        }

        await connection.commit();
        res.json({ success: true, message: "Configuration saved!" });
    } catch (error) {
        await connection.rollback();
        console.error("Save Error:", error.message);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.post('/api/judge/submit', async (req, res) => {
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


app.get('/api/judge/my-scores', async (req, res) => {
    try {
        const { judgeId } = req.query;

        if (!judgeId) {
            return res.status(400).json({ error: "Judge ID is required" });
        }

        // This query sums up all scores for each contestant for a specific judge
        // We JOIN with the contestants table to get their names
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

        // Return the array to the frontend
        res.json(rankings);

    } catch (err) {
        console.error("Scoreboard Fetch Error:", err.message);
        res.status(500).json({ error: "Failed to fetch judge rankings" });
    }
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 SQL-AI Server running on http://localhost:${PORT}`));




