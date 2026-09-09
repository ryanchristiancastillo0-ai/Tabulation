import {
  getSchoolId,
  setActiveSchoolId,
  clearActiveSchoolId,
  tokenSchoolId,
} from './getSchoolId';

export { getSchoolId, setActiveSchoolId, clearActiveSchoolId, tokenSchoolId };

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