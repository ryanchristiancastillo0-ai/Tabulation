// Single source of truth for resolving the active school id in any tab.
// Priority:
//   1. URL ?school_id=  → authoritative, already used by judge/admin routes
//   2. sessionStorage   → per-tab anchor set by the login flows
//   3. localStorage     → legacy fallback (last-login-wins, only used when the
//                          URL and the per-tab session don't know the school)
// localStorage is SHARED across every tab of the origin, so depending on it
// alone is what caused judge tables to load the wrong school when multiple
// schools were used in multiple tabs.

export function getSchoolId() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('school_id')) return params.get('school_id');

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