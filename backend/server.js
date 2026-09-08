require('dotenv').config();
const express = require('express');
const cors = require('cors');

const HttpError = require('./utils/http-error');
const { assertRedisConfigured } = require('./config/redis');
const dataRoutes  = require('./routes/data.routes');
const judgeRoutes = require('./routes/judge.routes');
const authRoutes  = require('./routes/auth.routes');
const schoolRoutes = require('./routes/school.routes');
const locationRoutes = require('./routes/location.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const aiRoutes     = require('./routes/ai.routes');

// Fail fast with a clear message when Upstash Redis is not configured.
assertRedisConfigured('server');

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
app.use('/api/ai',   aiRoutes);
app.use('/api', dataRoutes);

app.use('/api/leaderboard', leaderboardRoutes);

// ── Central error handler ──────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  const status = err instanceof HttpError ? err.status : 500;
  if (status >= 500) console.error('💥', err);
  res.status(status).json({ error: err.message });
});

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// ── Graceful shutdown (Render-compatible) ────────────────────────────────────
async function gracefulShutdown(signal) {
  console.log(`🛑 ${signal} received. Shutting down Express server…`);
  const forceExit = setTimeout(() => process.exit(1), 10000);
  forceExit.unref();

  try {
    await new Promise((resolve) => server.close(resolve));   // stop accepting new requests
    const { closeAll } = require('./config/redis');
    await closeAll();                                        // close BullMQ producer connection
    await require('./config/db').end();                      // close MySQL pool
    console.log('✅ Express server shut down cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Server shutdown error:', err.message);
    process.exit(1);
  }
}
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));