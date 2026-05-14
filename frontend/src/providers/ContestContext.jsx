import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function getSchoolId() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('school_id')) return params.get('school_id');
    const user = localStorage.getItem('adminUser');
    if (user) return JSON.parse(user)?.school_id || 1;
    const auth = localStorage.getItem('auth');
    if (auth) return JSON.parse(auth)?.admin?.school_id || 1;
    return 1;
  } catch {
    return 1;
  }
}

// ── Get auth token from localStorage ──────────────────────────────────────────
function getAuthToken() {
  try {
    const auth = localStorage.getItem('auth');
    if (auth) return JSON.parse(auth)?.token || null;
    const user = localStorage.getItem('adminUser');
    if (user) return JSON.parse(user)?.token || null;
    return null;
  } catch {
    return null;
  }
}

// ── Authenticated fetch helper ─────────────────────────────────────────────────
function authFetch(url, options = {}) {
  const token = getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ContestContext = createContext(null);

export const useContestContext = () => {
  const ctx = useContext(ContestContext);
  if (!ctx) throw new Error('useContestContext must be used inside <ContestProvider>');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ContestProvider = ({ children, pollInterval = 4000 }) => {
  const schoolId = getSchoolId();

  // ── Lock state ──
  const [isJudgeLocked,   setIsJudgeLocked]   = useState(false);
  const [lockLoading,     setLockLoading]     = useState(false);
  const [lockError,       setLockError]       = useState(null);

  // ── Contest meta ──
  const [contestName,     setContestName]     = useState('');
  const [judgeCount,      setJudgeCount]      = useState(0);
  const [calculationType, setCalculationType] = useState('average');

  const [ready, setReady] = useState(false);

  const lockedRef = useRef(isJudgeLocked);
  useEffect(() => { lockedRef.current = isJudgeLocked; }, [isJudgeLocked]);

  // ── Fetch config — uses PUBLIC endpoint so no auth needed ─────────────────
  const fetchConfig = useCallback(async () => {
    try {
      // Public endpoint — no auth header needed, uses school_id query param
      const res  = await fetch(`${API_BASE}/public/get-all-data?school_id=${schoolId}`);
      const data = await res.json();

      if (data && !data.error) {
        const settings = data.settings || {};

        const serverLocked =
          settings.is_judge_locked === 1 ||
          settings.is_judge_locked === true ||
          settings.is_judge_locked === '1';

        if (serverLocked !== lockedRef.current) {
          setIsJudgeLocked(serverLocked);
        }

        if (settings.contest_name     !== undefined) setContestName(settings.contest_name || '');
        if (settings.judge_count      !== undefined) setJudgeCount(Number(settings.judge_count) || 0);
        if (settings.computation_type !== undefined) setCalculationType(settings.computation_type || 'average');
      }
    } catch (err) {
      console.warn('[ContestContext] poll error:', err.message);
    } finally {
      if (!ready) setReady(true);
    }
  }, [schoolId, ready]);

  // ── Initial fetch + polling ──
  useEffect(() => {
    fetchConfig();
    const interval = setInterval(fetchConfig, pollInterval);
    return () => clearInterval(interval);
  }, [fetchConfig, pollInterval]);

  // ── Lock / Unlock — PROTECTED endpoint, needs auth header ────────────────
  const setLockState = useCallback(async (locked) => {
    setLockLoading(true);
    setLockError(null);

    // Optimistic update
    setIsJudgeLocked(locked);

    try {
      const res = await authFetch(`${API_BASE}/save-config`, {
        method: 'POST',
        body: JSON.stringify({
          is_judge_locked: locked ? 1 : 0,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save lock state');

    } catch (err) {
      // Rollback on failure
      setIsJudgeLocked(!locked);
      setLockError(err.message);
      console.error('[ContestContext] setLockState error:', err.message);
    } finally {
      setLockLoading(false);
    }
  }, [schoolId]);

  const lockJudges   = useCallback(() => setLockState(true),  [setLockState]);
  const unlockJudges = useCallback(() => setLockState(false), [setLockState]);
  const toggleLock   = useCallback(() => setLockState(!lockedRef.current), [setLockState]);

  const refresh = useCallback(() => fetchConfig(), [fetchConfig]);

  const value = {
    isJudgeLocked,
    lockLoading,
    lockError,
    lockJudges,
    unlockJudges,
    toggleLock,
    contestName,
    judgeCount,
    calculationType,
    ready,
    refresh,
    schoolId,
  };

  return (
    <ContestContext.Provider value={value}>
      {children}
    </ContestContext.Provider>
  );
};

export default ContestContext;