require('dotenv').config();
const express = require('express');
const cors = require('cors');

const HttpError = require('./utils/http-error');
const dataRoutes  = require('./routes/data.routes');
const judgeRoutes = require('./routes/judge.routes');
const authRoutes  = require('./routes/auth.routes');
const schoolRoutes = require('./routes/school.routes');
const locationRoutes = require('./routes/location.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/feedback', feedbackRoutes);
app.use('/api/locations', locationRoutes);

app.use('/api/admin',  authRoutes);
app.use('/api/auth',   authRoutes);
app.use('/api/schools', schoolRoutes);

app.use('/api/judge', judgeRoutes);
app.use('/api', dataRoutes);

app.use('/api/leaderboard', leaderboardRoutes);

// ── Central error handler ──────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  const status = err instanceof HttpError ? err.status : 500;
  if (status >= 500) console.error('💥', err);
  res.status(status).json({ error: err.message });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));