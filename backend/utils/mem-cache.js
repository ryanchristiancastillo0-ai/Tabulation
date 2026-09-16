// ── In-memory application cache (Map + TTL) ──────────────────────────────────
// Drop-in replacement for the previous Redis application cache module.
// Same function signatures + key naming as before, so callers never change.
// The cache lives only in this process and is cleared on restart/redeploy —
// acceptable for a single-server deployment (the DB is always the fallback).
// Every operation is fail-safe: a cache problem can never break the app.

// TTLs chosen for the actual data — public contest data changes rarely but IS
// invalidated explicitly on writes, so 5 min is safe.
const CACHE_TTL_SECONDS = {
  PUBLIC_ALL_DATA:      300,   // 5 min  (settings + contestants + criteria)
  PUBLIC_SYSTEM_CONFIG: 300,   // 5 min  (system_config)
  GENERATED_UI:         1800,  // 30 min (kept for API parity; unused)
};

const store = new Map(); // key → { value, expiresAt }

function cacheGet(key) {
  try {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      store.delete(key);
      return null;
    }
    return entry.value == null ? null : String(entry.value);
  } catch (err) {
    console.error('❌ [mem-cache] read failed (falling back to DB):', err.message);
    return null;
  }
}

async function cacheGetJson(key) {
  const raw = cacheGet(key);
  if (raw == null) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function cacheSet(key, value, ttlSeconds = 300) {
  try {
    store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    return true;
  } catch (err) {
    console.error('❌ [mem-cache] write failed (ignoring):', err.message);
    return false;
  }
}

async function cacheSetJson(key, value, ttlSeconds = 300) {
  return cacheSet(key, JSON.stringify(value), ttlSeconds);
}

function cacheDel(key) {
  try {
    store.delete(key);
  } catch (err) {
    console.error('❌ [mem-cache] delete failed (ignoring):', err.message);
  }
}

// Best-effort delete by glob pattern (e.g. all cached UI for a school).
function cacheDelPattern(pattern) {
  try {
    const re = new RegExp('^' + pattern.split('*').map(escapeRegExp).join('.*') + '$');
    for (const key of Array.from(store.keys())) {
      if (re.test(key)) store.delete(key);
    }
  } catch (err) {
    console.error('❌ [mem-cache] pattern delete failed (ignoring):', err.message);
  }
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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