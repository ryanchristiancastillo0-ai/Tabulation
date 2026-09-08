// ── Redis application cache helpers (@upstash/redis REST client) ──────────────
// Every read falls back to the database and every write failure is logged and
// ignored, so a Redis outage can never take down normal DB-backed functionality.

const { getCacheClient } = require('../config/redis');

// TTLs chosen for the actual data — public contest data and generated UI change
// rarely but ARE invalidated explicitly on writes, so 5–30 min is safe.
const CACHE_TTL_SECONDS = {
  PUBLIC_ALL_DATA:  300,   // 5 min  (settings + contestants + criteria)
  PUBLIC_SYSTEM_CONFIG: 300, // 5 min (system_config)
  GENERATED_UI:     1800,  // 30 min (AI-generated scoring table html)
};

async function cacheGet(key) {
  try {
    const value = await getCacheClient().get(key);
    return value == null ? null : String(value);
  } catch (err) {
    console.error('❌ [cache] read failed (falling back to DB):', err.message);
    return null;
  }
}

async function cacheGetJson(key) {
  const raw = await cacheGet(key);
  if (raw == null) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function cacheSet(key, value, ttlSeconds = 300) {
  try {
    await getCacheClient().set(key, value, { ex: ttlSeconds });
    return true;
  } catch (err) {
    console.error('❌ [cache] write failed (ignoring):', err.message);
    return false;
  }
}

async function cacheSetJson(key, value, ttlSeconds = 300) {
  return cacheSet(key, JSON.stringify(value), ttlSeconds);
}

async function cacheDel(key) {
  try {
    await getCacheClient().del(key);
  } catch (err) {
    console.error('❌ [cache] delete failed (ignoring):', err.message);
  }
}

// Best-effort delete by glob pattern (e.g. all cached UI for a school).
async function cacheDelPattern(pattern) {
  try {
    const keys = await getCacheClient().keys(pattern);
    if (Array.isArray(keys) && keys.length > 0) {
      await getCacheClient().del(...keys);
    }
  } catch (err) {
    console.error('❌ [cache] pattern delete failed (ignoring):', err.message);
  }
}

module.exports = {
  CACHE_TTL_SECONDS,
  cacheGet,
  cacheGetJson,
  cacheSet,
  cacheSetJson,
  cacheDel,
  cacheDelPattern,
};