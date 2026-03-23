require('dotenv').config(); // MUST BE AT THE VERY TOP
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// 1. DATABASE CONNECTION (Using your env variables)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'tabulation_db',
    waitForConnections: true,
    connectionLimit: 10
});

// 2. 2026 ACTIVE MODELS (The chain that actually works for you)
const MODEL_CHAIN = ["gemini-3.1-flash-lite-preview", "gemini-2.5-flash"];

// 3. CLEAN AI FETCH (SDK-Free with Fallback Chain)
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
                console.warn(`⚠️ ${modelName} failed: ${data.error?.message || response.status}`);
                continue; // Try next model in the chain
            }

            if (!data.candidates || data.candidates.length === 0) {
                console.warn(`⚠️ ${modelName} returned no content (Safety Block).`);
                continue;
            }

            return data.candidates[0].content.parts[0].text;
        } catch (err) {
            console.error(`❌ System Error with ${modelName}:`, err.message);
        }
    }
    throw new Error("AI failed to respond. All models in chain exhausted.");
}

// 3. ROUTE: GET ALL DATA (For initial load)
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

// 4. ROUTE: RENDER UI (The AI Interface Generator)
app.post('/api/judge/render-ui', async (req, res) => {
    try {
        const { prompt: promptVibe, contestants, criteria } = req.body;
        
        // Pull saved settings to ensure the UI matches your dashboard vibe
        const [rows] = await pool.execute("SELECT theme_json, contest_name FROM settings WHERE id = 1");
        const settings = rows[0] || { contest_name: "Contest", theme_json: "{}" };

        const aiInstruction = `
            Act as a Senior Web Developer. Create a professional SCORING UI using Tailwind CSS.
            CONTEST: ${settings.contest_name}
            VIBE: ${promptVibe || 'Modern & Clean'}
            THEME: ${settings.theme_json}
            DATA: Contestants ${JSON.stringify(contestants)}, Criteria ${JSON.stringify(criteria)}

            TECHNICAL RULES:
            1. Every contestant must have a card with their name and number.
            2. Every criterion needs an <input type="number" min="0" max="100" class="border p-2 rounded w-full">.
            3. MANDATORY ID FORMAT: id="score-{contestantId}-{criterionId}"
            4. Return ONLY the HTML code inside a <div>. No markdown backticks (no \`\`\`html).
        `;

        const html = await generateWithFallback(aiInstruction);
        // Robust cleaning for the AI response
        const cleanHTML = html.replace(/```html/g, "").replace(/```/g, "").trim();
        
        res.json({ html: cleanHTML });
    } catch (err) {
        console.error("Route Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 5. ROUTE: SUBMIT SCORES
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 SQL-AI Server running on http://localhost:${PORT}`));