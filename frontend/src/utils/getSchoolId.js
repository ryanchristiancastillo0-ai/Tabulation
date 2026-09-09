// Single source of truth for resolving the active school id in any tab.
// Priority:
//   1. URL ?school_id=  → raw numeric school id (admin/leaderboard routes)
//   2. URL ?sc=         → opaque judge slug; looked up against the per-school
//                          slug map below so judges never see/have to type a
//                          numeric school id in the judge URL
//   3. sessionStorage   → per-tab anchor set by the login flows
//   4. localStorage     → legacy fallback (last-login-wins, only used when the
//                          URL and the per-tab session don't know the school)
// localStorage is SHARED across every tab of the origin, so depending on it
// alone is what caused judge tables to load the wrong school when multiple
// schools were used in multiple tabs.

const JUDGE_SLUG_MAP_KEY = 'judge_school_slugs'; // JSON: { "<schoolId>": "<opaque slug>" }

function generateSlug() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, '');
    }
  } catch { /* fall through */ }
  return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 18);
}

// Returns (and lazily creates) the stable opaque slug that represents a school
// in judge URLs. The slug is random, long, and never the numeric id, so a
// casual user cannot guess "2" or "3" to switch schools.
export function ensureJudgeSchoolSlug(schoolId) {
  const key = String(schoolId);
  const existing = getJudgeSchoolSlug(key);
  if (existing) return existing;

  const slug = generateSlug();
  try {
    const map = JSON.parse(localStorage.getItem(JUDGE_SLUG_MAP_KEY) || '{}');
    map[key] = slug;
    localStorage.setItem(JUDGE_SLUG_MAP_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
  return slug;
}

export function getJudgeSchoolSlug(schoolId) {
  try {
    const map = JSON.parse(localStorage.getItem(JUDGE_SLUG_MAP_KEY) || '{}');
    return map[String(schoolId)] || null;
  } catch {
    return null;
  }
}

// Reverse lookup: ?sc=<slug> → numeric school id. Returns null when the slug
// is unknown/tampered, so callers fall back to the session's real school.
function resolveJudgeSchoolBySlug(slug) {
  if (!slug) return null;
  try {
    const map = JSON.parse(localStorage.getItem(JUDGE_SLUG_MAP_KEY) || '{}');
    for (const [id, val] of Object.entries(map)) {
      if (val === slug) return id;
    }
  } catch { /* ignore */ }
  return null;
}

export function getSchoolId() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('school_id')) return params.get('school_id');

    const slug = params.get('sc');
    if (slug) {
      const resolved = resolveJudgeSchoolBySlug(slug);
      if (resolved) return resolved;
    }

    const session = sessionStorage.getItem('active_school_id');
    if (session) return session;

    const direct = localStorage.getItem('school_id');
    if (direct) return direct;

    const judgeSchool = localStorage.getItem('judgeSchool');
    if (judgeSchool) return JSON.parse(judgeSchool)?.id || 1;

    const user = localStorage.getItem('adminUser');
    if (user) return JSON.parse(user)?.school_id || 1;

    const auth = localStorage.getItem('auth');
    if (auth) {
      const parsed = JSON.parse(auth);
      return parsed?.admin?.school_id || parsed?.school?.id || 1;
    }
    return 1;
  } catch {
    return 1;
  }
}

export function setActiveSchoolId(id) {
  if (!id) return;
  try {
    sessionStorage.setItem('active_school_id', String(id));
  } catch {
    /* ignore */
  }
}

export function clearActiveSchoolId() {
  try {
    sessionStorage.removeItem('active_school_id');
  } catch {
    /* ignore */
  }
}

// Decodes school_id out of a JWT payload (used to validate stored tokens).
export function tokenSchoolId(token) {
  if (!token) return null;
  try {
    const payload = base64UrlDecode(token.split('.')[1]);
    return JSON.parse(payload)?.school_id || null;
  } catch {
    return null;
  }
}

// True when a JWT exists but its exp claim is already in the past. Used by the
// router guards so an expired session sends the user to login instead of
// letting the dashboard mount and hammer the API with 401s.
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(base64UrlDecode(token.split('.')[1]));
    const exp = payload?.exp;
    if (!exp) return false;
    return Date.now() / 1000 > exp;
  } catch {
    return true;
  }
}

// JWT payloads are base64url (uses - and _ instead of + and /); normalize to
// plain base64 before decoding so we never throw on standard JWT characters.
function base64UrlDecode(input) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// React Router's navigate() uses history.pushState/replaceState, which do NOT
// fire a native 'popstate' event. Patch history so URL-driven providers (e.g.
// ConfigChangeContext) can re-derive the school id when the route changes
// in-place (e.g. /judge/login -> /judge?school_id=2).
export function patchHistoryForSchoolSync() {
  try {
    if (window.__schoolHistoryPatched) return;
    window.__schoolHistoryPatched = true;
    ['pushState', 'replaceState'].forEach((method) => {
      const original = window.history[method];
      window.history[method] = function (...args) {
        const result = original.apply(this, args);
        window.dispatchEvent(new Event('school_id_urlchange'));
        return result;
      };
    });
  } catch {
    /* ignore */
  }
}