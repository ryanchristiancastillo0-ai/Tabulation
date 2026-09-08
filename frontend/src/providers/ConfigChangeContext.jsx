import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getSchoolId } from '../utils/judge';

const ConfigChangeContext = createContext(null);

export const useConfigChange = () => {
  const ctx = useContext(ConfigChangeContext);
  if (!ctx) throw new Error('useConfigChange must be used inside <ConfigChangeProvider>');
  return ctx;
};

/**
 * Cross-tab "config changed" signalling.
 *
 * Admin tab calls notifyConfigChanged() after a successful save. Any other
 * open tab of the same origin (e.g. the judge page) receives the signal via:
 *   1. BroadcastChannel (instant, no server round-trip)
 *   2. localStorage 'storage' event fallback
 *
 * changeCount increments once per signal, deduplicated across both channels
 * (they share the same localStorage timestamp, so only the first mechanism
 * that observes it actually increments).
 *
 * Notes:
 * - BroadcastChannel/storage events only fire in OTHER tabs, never the
 *   sender's own tab, so the admin never accidentally triggers itself.
 * - A freshly-opened judge tab does not re-trigger (baseline is recorded on
 *   mount) — the normal config-fetch / cache-key path handles that case.
 */
export const ConfigChangeProvider = ({ children }) => {
  const schoolId = getSchoolId();
  const [changeCount, setChangeCount] = useState(0);

  const channelName = `config-change-${schoolId}`;
  const signalKey   = `config_signal_${schoolId}`;

  const lastSeenRef = useRef(null);

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
    <ConfigChangeContext.Provider value={{ changeCount, notifyConfigChanged }}>
      {children}
    </ConfigChangeContext.Provider>
  );
};

export default ConfigChangeContext;