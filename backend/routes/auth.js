const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// ── ADMIN REGISTER (One-time use) ──
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.execute(
            "INSERT INTO admins (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        res.json({ success: true, message: "Admin registered successfully." });
    } catch (err) {
        res.status(500).json({ error: "Registration failed: " + err.message });
    }
});

// ── ADMIN LOGIN ──
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await pool.execute('SELECT * FROM admins WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '2h' }
        );

        res.json({ 
            success: true,
            token, 
            message: "Login successful",
            admin: { id: user.id, name: user.name, email: user.email }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Server error: " + err.message });
    }
});

// ── RESET PASSWORD ──
router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ error: "Email and new password are required." });
    }

    try {
        // Check if admin exists
        const [users] = await pool.execute('SELECT * FROM admins WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(404).json({ error: "No account found with that email address." });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update DB
        await pool.execute('UPDATE admins SET password = ? WHERE email = ?', [hashedPassword, email]);

        return res.status(200).json({ 
            success: true,
            message: "Password updated successfully."
        });

    } catch (err) {
        console.error("Reset Password Error:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// ── LOGOUT ──
// Note: JWT is stateless. Real logout happens on the Frontend by 
// removing the token from LocalStorage. This route is for cleanup/logging.
router.post('/logout', (req, res) => {
    res.json({ success: true, message: "Logged out successfully." });
});

module.exports = router;