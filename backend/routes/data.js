const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all settings, contestants, criteria
router.get('/get-all-data', async (req, res) => {
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

// GET leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const [settings] = await pool.execute("SELECT computation_type, judge_count FROM settings WHERE id = 1");
        const type = settings[0].computation_type;

        const [rawScores] = await pool.execute(`
            SELECT judge_id, contestant_id, c.name, SUM(score_value) as judge_total
            FROM scores s
            JOIN contestants c ON s.contestant_id = c.id
            GROUP BY judge_id, contestant_id
        `);

        if (type === 'average') {
            const [results] = await pool.execute(`
                SELECT c.name, SUM(s.score_value) / ? as final_score
                FROM scores s
                JOIN contestants c ON s.contestant_id = c.id
                GROUP BY c.id ORDER BY final_score DESC
            `, [settings[0].judge_count]);
            return res.json(results);
        } else {
            const judgeRanks = {};
            rawScores.forEach(s => {
                if (!judgeRanks[s.judge_id]) judgeRanks[s.judge_id] = [];
                judgeRanks[s.judge_id].push(s);
            });

            const finalTallies = {};

            Object.values(judgeRanks).forEach(scores => {
                scores.sort((a, b) => b.judge_total - a.judge_total);
                scores.forEach((s, index) => {
                    const rank = index + 1;
                    if (!finalTallies[s.contestant_id]) {
                        finalTallies[s.contestant_id] = { name: s.name, total_rank: 0 };
                    }
                    finalTallies[s.contestant_id].total_rank += rank;
                });
            });

            const result = Object.values(finalTallies).sort((a, b) => a.total_rank - b.total_rank);
            return res.json(result);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE reset all system data
router.delete('/reset-data', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        console.log("⚠️ Starting System Reset...");

        await connection.execute("DELETE FROM scores");
        await connection.execute("DELETE FROM ui_cache");
        await connection.execute("DELETE FROM contestants");
        await connection.execute("DELETE FROM criteria");
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

// POST save contest config
router.post('/save-config', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const {
            contest_name,
            judge_count,
            ai_prompt,
            contestants,
            criteria,
            computation_type,
            contest_type,
            is_judge_locked // <-- 1. ADDED
        } = req.body;

        await connection.beginTransaction();

        // 2. ADDED is_judge_locked = ? TO THE SQL STRING
        const updateSettingsSql = `
            UPDATE settings 
            SET contest_name = ?, contest_type = ?, judge_count = ?, ai_prompt = ?, computation_type = ?, is_judge_locked = ? 
            WHERE id = 1
        `;

        // 3. ADDED is_judge_locked TO THE ARRAY
        await connection.execute(updateSettingsSql, [
            contest_name || '',
            contest_type || 'pageant',
            judge_count || 3,
            ai_prompt || '',
            computation_type || 'average',
            is_judge_locked || 0 // Defaults to 0 (unlocked) if not provided
        ]);

        await connection.execute("DELETE FROM contestants");
        if (contestants && contestants.length > 0) {
            const contestantSql = "INSERT INTO contestants (name, entry_number) VALUES (?, ?)";
            for (const c of contestants) {
                await connection.execute(contestantSql, [c.name || 'Unnamed', c.entry_number || 0]);
            }
        }

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
module.exports = router;
