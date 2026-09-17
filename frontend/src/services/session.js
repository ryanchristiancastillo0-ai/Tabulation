// Access-token refresh + session helpers for both admin and judge clients.
// Provides single-flight refresh so parallel 401s trigger exactly one POST to
// /auth/refresh, plus best-effort remote logout and local session cleanup.

import { getSchoolId } from '../utils/getSchoolId';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const ADMIN_REFRESH_PREFIX = 'admin_refresh_';
const JUDGE_REFRESH_PREFIX = 'judge_refresh_';

const adminRefreshKey = (sid) => `${ADMIN_REFRESH_PREFIX}${sid}`;
const judgeRefreshKey = (sid) => `${JUDGE_REFRESH_PREFIX}${sid}`;

function readAuthBlock() {
  try {
    const raw = localStorage.getItem('auth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAdminRefreshToken() {
  try {
    const sid = String(getSchoolId());
    const scoped = localStorage.getItem(adminRefreshKey(sid));
    if (scoped) return scoped;

    const auth = readAuthBlock();
    if (auth && auth.refreshToken && auth.admin && String(auth.admin.school_id) === sid) {
      return auth.refreshToken;
    }
    return null;
  } catch {
    return null;
  }
}

export function getJudgeRefreshToken() {
  try {
    const sid = String(getSchoolId());
    const scoped = localStorage.getItem(judgeRefreshKey(sid));
    if (scoped) return scoped;

    const auth = readAuthBlock();
    if (auth && auth.refreshToken && auth.role === 'judge' && auth.school && String(auth.school.id) === sid) {
      return auth.refreshToken;
    }
    return null;
  } catch {
    return null;
  }
}

// Persist a freshly refreshed access token everywhere the current code reads it.
export function setAdminAccessToken(token) {
  try {
    const sid = String(getSchoolId());
    if (!sid) return;
    localStorage.setItem(`admin_token_${sid}`, token);
    localStorage.setItem('adminToken', token);
    const auth = readAuthBlock();
    if (auth) {
      auth.token = token;
      localStorage.setItem('auth', JSON.stringify(auth));
    }
  } catch {
    /* ignore */
  }
}

export function setJudgeAccessToken(token) {
  try {
    const sid = String(getSchoolId());
    if (!sid) return;
    localStorage.setItem(`judge_token_${sid}`, token);
    localStorage.setItem('judgeToken', token);
    const auth = readAuthBlock();
    if (auth) {
      auth.token = token;
      localStorage.setItem('auth', JSON.stringify(auth));
    }
  } catch {
    /* ignore */
  }
}

// One in-flight refresh per role; concurrent 401 handlers share the same POST.
const pendingRefresh = {};

export async function refreshAccessToken(role) {
  if (pendingRefresh[role]) return pendingRefresh[role];

  pendingRefresh[role] = (async () => {
    const refresh = role === 'judge' ? getJudgeRefreshToken() : getAdminRefreshToken();
    if (!refresh) {
      const err = new Error('No refresh token available. Please sign in again.');
      err.code = 'no_session';
      throw err;
    }

    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refresh_token: refresh }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      const err = new Error(data.error || 'Your session has expired. Please sign in again.');
      err.code = data.code || 'invalid_session';
      throw err;
    }
    if (!res.ok) {
      throw new Error(data.error || `Refresh failed (HTTP ${res.status}).`);
    }
    if (!data.token) {
      throw new Error('No access token received from server.');
    }

    if (role === 'judge') setJudgeAccessToken(data.token);
    else setAdminAccessToken(data.token);
    return data.token;
  })().finally(() => {
    pendingRefresh[role] = null;
  });

  return pendingRefresh[role];
}

export function redirectToLogin(role) {
  if (typeof window === 'undefined') return;
  if (role === 'judge') {
    if (!window.location.pathname.startsWith('/judge/login')) {
      window.location.assign('/judge/login?expired=1');
    }
  } else if (!window.location.pathname.startsWith('/login')) {
    window.location.assign('/login?expired=1');
  }
}

export function clearAdminSession() {
  try {
    Object.keys(localStorage)
      .filter(
        (k) =>
          k.startsWith('admin_token_') || k.startsWith(ADMIN_REFRESH_PREFIX) ||
          k === 'adminToken' || k === 'adminUser' || k === 'auth'
      )
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export function clearJudgeSession() {
  try {
    const sid = String(getSchoolId());
    localStorage.removeItem('judgeToken');
    localStorage.removeItem('judgeSchool');
    localStorage.removeItem('auth');
    localStorage.removeItem(`judge_id_${sid}`);
    localStorage.removeItem(judgeRefreshKey(sid));
    localStorage.removeItem(`judge_token_${sid}`);
  } catch {
    /* ignore */
  }
}

// Best-effort remote logout. Never blocks the UI — local state is cleared
// regardless of whether the server call succeeds. Only THIS device's session
// is invalidated, so other logged-in devices stay online.
export async function logoutRemote(role) {
  try {
    const refresh = role === 'judge' ? getJudgeRefreshToken() : getAdminRefreshToken();
    if (!refresh) return;
    await fetch(`${API_BASE}/auth/logout`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refresh_token: refresh }),
    });
  } catch {
    /* ignore */
  }
}

export { adminRefreshKey, judgeRefreshKey };