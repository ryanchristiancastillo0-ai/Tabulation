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

const ContestContext = createContext(null);

export const useContestContext = () => {
  const ctx = useContext(ContestContext);
  if (!ctx) throw new Error('useContestContext must be used inside <ContestProvider>');
  return ctx;
};

export const ContestProvider = ({ children, pollInterval = 4000 }) => {
  const schoolId = getSchoolId();

  const [isJudgeLocked,   setIsJudgeLocked]   = useState(false);
  const [lockLoading,     setLockLoading]     = useState(false);
  const [lockError,       setLockError]       = useState(null);
  const [contestName,     setContestName]     = useState('');
  const [judgeCount,      setJudgeCount]      = useState(0);
  const [calculationType, setCalculationType] = useState('average');
  const [ready,           setReady]           = useState(false);

  const lockedRef = useRef(isJudgeLocked);
  useEffect(() => { lockedRef.current = isJudgeLocked; }, [isJudgeLocked]);

  const fetchConfig = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/public/get-all-data?school_id=${schoolId}`);
      const data = await res.json();

      if (data && !data.error) {
        const settings = data.settings || {};

        const serverLocked =
          settings.is_judge_locked === 1 ||
          settings.is_judge_locked === true ||
          settings.is_judge_locked === '1';

        if (serverLocked !== lockedRef.current) setIsJudgeLocked(serverLocked);
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

  useEffect(() => {
    fetchConfig();
    const interval = setInterval(fetchConfig, pollInterval);
    return () => clearInterval(interval);
  }, [fetchConfig, pollInterval]);

  // ── Lock / Unlock (admin only, protected endpoint) ────────────────────────
  const setLockState = useCallback(async (locked) => {
    setLockLoading(true);
    setLockError(null);
    setIsJudgeLocked(locked); // optimistic

    try {
      const res  = await authFetch(`${API_BASE}/save-config`, {
        method: 'POST',
        body: JSON.stringify({ is_judge_locked: locked ? 1 : 0 }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save lock state');
    } catch (err) {
      setIsJudgeLocked(!locked); // rollback
      setLockError(err.message);
      console.error('[ContestContext] setLockState error:', err.message);
    } finally {
      setLockLoading(false);
    }
  }, []);

  const lockJudges   = useCallback(() => setLockState(true),  [setLockState]);
  const unlockJudges = useCallback(() => setLockState(false), [setLockState]);
  const toggleLock   = useCallback(() => setLockState(!lockedRef.current), [setLockState]);
  const refresh      = useCallback(() => fetchConfig(), [fetchConfig]);

  return (
    <ContestContext.Provider value={{
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
    }}>
      {children}
    </ContestContext.Provider>
  );
};

export default ContestContext;