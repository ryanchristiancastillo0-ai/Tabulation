const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// ── CREATE SCHOOL + ADMIN (atomic) ──
router.post('/create', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            school_name,
            school_logo,
            school_email,
            school_phone,
            school_address,
            subscription_plan,
            // admin fields
            admin_name,
            admin_email,
            admin_password,
        } = req.body;

        if (!school_name) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ error: 'school_name is required.' });
        }

        if (!admin_name || !admin_email || !admin_password) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ error: 'Admin name, email, and password are required.' });
        }

        // ── Step 1: insert school ──────────────────────────────────────
        const [schoolResult] = await conn.execute(
            `INSERT INTO schools
                (school_name, school_logo, school_email, school_phone, school_address, subscription_plan, status)
             VALUES (?, ?, ?, ?, ?, ?, 'active')`,
            [
                school_name,
                school_logo       || null,
                school_email      || null,
                school_phone      || null,
                school_address    || null,
                subscription_plan || 'free',
            ]
        );

        const school_id = schoolResult.insertId; // real auto-increment ID

        // ── Step 2: insert admin linked to that school ─────────────────
        const hashedPassword = await bcrypt.hash(admin_password, 10);

        const [adminResult] = await conn.execute(
            `INSERT INTO admins (name, email, password, school_id)
             VALUES (?, ?, ?, ?)`,
            [admin_name, admin_email, hashedPassword, school_id]
        );

        await conn.commit();
        conn.release();

        res.status(201).json({
            success:  true,
            message:  'School and admin created successfully.',
            school_id,
            admin_id: adminResult.insertId,
        });

    } catch (err) {
        await conn.rollback();
        conn.release();

        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'A school or admin with this email already exists.' });
        }
        console.error('Create school error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── GET ALL SCHOOLS ──
router.get('/', async (req, res) => {
    try {
        const [schools] = await pool.execute(
            'SELECT * FROM schools ORDER BY created_at DESC'
        );
        res.json(schools);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET SINGLE SCHOOL ──
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM schools WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'School not found.' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── UPDATE SCHOOL ──
router.put('/:id', async (req, res) => {
    try {
        const {
            school_name, school_logo, school_email,
            school_phone, school_address, subscription_plan, status,
        } = req.body;

        await pool.execute(
            `UPDATE schools
             SET school_name       = ?,
                 school_logo       = ?,
                 school_email      = ?,
                 school_phone      = ?,
                 school_address    = ?,
                 subscription_plan = ?,
                 status            = ?
             WHERE id = ?`,
            [
                school_name,
                school_logo       || null,
                school_email      || null,
                school_phone      || null,
                school_address    || null,
                subscription_plan || 'free',
                status            || 'active',
                req.params.id,
            ]
        );

        res.json({ success: true, message: 'School updated successfully.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'A school with this email already exists.' });
        }
        console.error('Update school error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE SCHOOL ──
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM schools WHERE id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'School not found.' });
        }
        res.json({ success: true, message: 'School deleted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;