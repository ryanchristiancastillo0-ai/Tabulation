require('dotenv').config();
const express = require('express');
const cors = require('cors');

const dataRoutes  = require('./routes/data');
const judgeRoutes = require('./routes/judge');
const authRoutes  = require('./routes/auth');
const schoolRoutes = require('./routes/school');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Public routes (no auth) ──────────────────────────────────────
app.use('/api/admin',   authRoutes);    // POST /api/admin/login
app.use('/api/auth',    authRoutes);    // POST /api/auth/login
app.use('/api/schools', schoolRoutes);  // POST /api/schools/create  ← MOVED UP

// ── Protected routes (auth middleware is inside these routers) ───
app.use('/api/judge',   judgeRoutes);
app.use('/api',         dataRoutes);    // ← must stay LAST, it's the catch-all

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));