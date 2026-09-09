import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getSchoolId, patchHistoryForSchoolSync } from '../utils/getSchoolId';

const ConfigChangeContext = createContext(null);

export const useConfigChange = () => {
  const ctx = useContext(ConfigChangeContext);
  if (!ctx) throw new Error('useConfigChange must be used inside <ConfigChangeProvider>');
  return ctx;
};

/**
 * Cross-tab "config changed" signalling, scoped to ONE school.
 *
 * Admin tab calls notifyConfigChanged() after a successful save. Any other
 * open tab of the SAME school receives the signal via:
 *   1. BroadcastChannel (instant, no server round-trip)
 *   2. localStorage 'storage' event fallback
 *
 * The channel + storage key are built from `school_id`, which is resolved
 * URL-first (see utils/getSchoolId). Judge/admin routes carry ?school_id= in
 * the URL, so each school gets its own channel and a save for school 1 can
 * NEVER trigger a reload of school 2's judge tab, even in multi-tab use.
 *
 * changeCount increments once per signal, deduplicated across both channels
 * (they share the same localStorage timestamp, so only the first mechanism
 * that observes it actually increments).
 */
export const ConfigChangeProvider = ({ children }) => {
  const [schoolId, setSchoolId] = useState(() => getSchoolId());
  const [changeCount, setChangeCount] = useState(0);

  const channelName = `config-change-${schoolId}`;
  const signalKey   = `config_signal_${schoolId}`;

  const lastSeenRef = useRef(null);

  // Re-resolve the school whenever the URL changes (react-router navigations
  // like /judge?school_id=2, admin ?tab=…, back/forward, etc.), so the channel
  // always tracks the school this tab is actually showing.
  useEffect(() => {
    const sync = () => setSchoolId(getSchoolId());
    window.addEventListener('popstate', sync);
    window.addEventListener('school_id_urlchange', sync);
    patchHistoryForSchoolSync();
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('school_id_urlchange', sync);
    };
  }, []);

  useEffect(() => {
    if (!schoolId) return;

    // Baseline = whatever signal timestamp exists at mount time. Only NEW
    // values after this point count as a real config change, so a
    // freshly-opened tab never re-triggers on an old save.
    try {
      lastSeenRef.current = localStorage.getItem(signalKey) || null;
    } catch {
      lastSeenRef.current = null;
    }

    // Dedupe: both the BroadcastChannel message and the storage event carry
    // the same localStorage timestamp, so only a NEW value increments.
    const checkSignal = () => {
      try {
        const val = localStorage.getItem(signalKey);
        if (!val) return;
        if (val !== lastSeenRef.current) {
          lastSeenRef.current = val;
          setChangeCount((c) => c + 1);
        }
      } catch {
        /* ignore */
      }
    };

    let channel = null;
    try {
      channel = new BroadcastChannel(channelName);
      channel.onmessage = (e) => {
        if (e.data?.type === 'CONFIG_SAVED') checkSignal();
      };
    } catch {
      channel = null;
    }

    // storage event fallback — fires when ANOTHER tab writes to localStorage.
    const onStorage = (e) => {
      if (e.key === signalKey) checkSignal();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      channel?.close();
      window.removeEventListener('storage', onStorage);
    };
  }, [schoolId, channelName, signalKey]);

  const notifyConfigChanged = useCallback(() => {
    const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    localStorage.setItem(signalKey, stamp);
    try {
      const channel = new BroadcastChannel(channelName);
      channel.postMessage({ type: 'CONFIG_SAVED', ts: stamp });
      channel.close();
    } catch {
      /* BroadcastChannel unsupported — storage event still delivers */
    }
  }, [channelName, signalKey]);

  return (
    <ConfigChangeContext.Provider value={{ changeCount, notifyConfigChanged, schoolId }}>
      {children}
    </ConfigChangeContext.Provider>
  );
};

export default ConfigChangeContext;