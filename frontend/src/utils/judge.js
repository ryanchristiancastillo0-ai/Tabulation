import {
  getSchoolId,
  setActiveSchoolId,
  clearActiveSchoolId,
  tokenSchoolId,
  isTokenExpired,
  ensureJudgeSchoolSlug,
} from './getSchoolId';

export {
  getSchoolId,
  setActiveSchoolId,
  clearActiveSchoolId,
  tokenSchoolId,
  isTokenExpired,
  ensureJudgeSchoolSlug,
};

// ── Per-school judge token helpers ────────────────────────────────
// Older sessions stored the judge token in a single shared 'judgeToken' key,
// which leaked across schools in multi-tab use. We now store it per school
// and only fall back to the legacy key when it actually belongs to this school.

export function getJudgeToken(schoolId) {
  const sid = String(schoolId);
  try {
    const scoped = localStorage.getItem(`judge_token_${sid}`) || null;
    if (scoped) return scoped;
    const legacy = localStorage.getItem('judgeToken') || null;
    if (legacy && String(tokenSchoolId(legacy)) === sid) return legacy;
    return null;
  } catch {
    return null;
  }
}

export function setJudgeToken(schoolId, token) {
  const sid = String(schoolId);
  try {
    if (token) localStorage.setItem(`judge_token_${sid}`, token);
  } catch {
    /* ignore */
  }
}

export function clearJudgeToken(schoolId) {
  const sid = String(schoolId);
  try {
    localStorage.removeItem(`judge_token_${sid}`);
  } catch {
    /* ignore */
  }
}

// ── Judge auth helpers used by the router guard ───────────────────

function tokenValidForSchool(token, sid) {
  if (!token || token === 'undefined' || isTokenExpired(token)) return false;
  return String(tokenSchoolId(token)) === String(sid);
}

// The judge's REAL school: session anchor first (per-tab), then any valid
// per-school token, then the legacy token. This is the single source of truth
// the guard compares against — the URL is never trusted.
export function getValidJudgeSchool() {
  try {
    const session = sessionStorage.getItem('active_school_id');
    if (session && tokenValidForSchool(getJudgeToken(session), session)) return session;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const match = key && key.match(/^judge_token_(\d+)$/);
      if (match && tokenValidForSchool(localStorage.getItem(key), match[1])) return match[1];
    }

    const legacy = localStorage.getItem('judgeToken');
    if (legacy && tokenValidForSchool(legacy, tokenSchoolId(legacy))) {
      return String(tokenSchoolId(legacy));
    }
    return null;
  } catch {
    return null;
  }
}

// Canonical judge URL for a school: `/path?sc=<opaque-slug>`. The numeric
// school id is never exposed in the judge URL — only a per-school random slug
// that the browser can resolve back to the school id locally.
export function getJudgePageUrl(path, schoolId) {
  const slug = ensureJudgeSchoolSlug(String(schoolId));
  return `${path}?sc=${encodeURIComponent(slug)}`;
}