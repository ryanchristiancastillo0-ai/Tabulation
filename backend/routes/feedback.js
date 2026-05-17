// routes/feedback.js

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// ─────────────────────────────────────────────
// PUBLIC FEEDBACK ROUTE
// POST /api/feedback
// ─────────────────────────────────────────────

router.post('/', async (req, res) => {

    try {

        const {
            name,
            email,
            message
        } = req.body;

        // VALIDATION
        if (!name || !email || !message) {
            return res.status(400).json({
                error: 'All fields are required.'
            });
        }

        // TRANSPORTER
        const transporter = nodemailer.createTransport({

            service: 'gmail',

            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }

        });

        // EMAIL
        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: process.env.RECEIVER_EMAIL,

            subject: 'New Feedback Message',

            html: `
                <div style="font-family: Arial; padding: 20px;">

                    <h2>New Feedback</h2>

                    <p>
                        <strong>Name:</strong> ${name}
                    </p>

                    <p>
                        <strong>Email:</strong> ${email}
                    </p>

                    <p>
                        <strong>Message:</strong>
                    </p>

                    <div style="
                        background: #f4f4f4;
                        padding: 15px;
                        border-radius: 8px;
                    ">
                        ${message}
                    </div>

                </div>
            `
        });

        res.json({
            success: true,
            message: 'Feedback sent successfully.'
        });

    } catch (err) {

        console.error('Feedback Error:', err.message);

        res.status(500).json({
            error: err.message
        });

    }

});

module.exports = router;