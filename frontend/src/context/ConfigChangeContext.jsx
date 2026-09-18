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
  // Flag the admin sets the MOMENT a Save starts and clears when it finishes.
  // Judge tabs treat its presence as "the design is being regenerated": they
  // show the loading state on the judge card and ignore the ui_cache row until
  // the flag clears, so a stale design is never applied mid-generation.
  const uiGenerationKey = `ui_generating_${schoolId}`;

  const lastSeenRef = useRef(null);

  // When the admin clicks Save, the ui_cache wipe + AI generation can take
  // 10-45s. Judges must reload the instant the click happens (not 5s later
  // when their poll runs) and keep that loading state until the new design is
  // cached. A timestamp is stored so browsers whose admin tab died mid-save
  // can detect staleness and never spin forever.
  const markUiGenerating = useCallback(() => {
    try {
      localStorage.setItem(uiGenerationKey, String(Date.now()));
    } catch { /* ignore */ }
  }, [uiGenerationKey]);

  const clearUiGenerating = useCallback(() => {
    try {
      localStorage.removeItem(uiGenerationKey);
    } catch { /* ignore */ }
  }, [uiGenerationKey]);

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
        if (e.data?.type === 'UI_GENERATING') markUiGenerating();
        else if (e.data?.type === 'CONFIG_SAVED') {
          clearUiGenerating();
          checkSignal();
        }
      };
    } catch {
      channel = null;
    }

    // storage event fallback — fires when ANOTHER tab writes to localStorage.
    const onStorage = (e) => {
      if (e.key === signalKey) checkSignal();
      else if (e.key === uiGenerationKey) {
        if (e.newValue) markUiGenerating();
        else clearUiGenerating();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      channel?.close();
      window.removeEventListener('storage', onStorage);
    };
  }, [schoolId, channelName, signalKey, uiGenerationKey, markUiGenerating, clearUiGenerating]);

  // Broadcast a signal to every open tab of this school (including this one),
  // falling back to the localStorage 'storage' event when BroadcastChannel is
  // unavailable. Returns the shared timestamp so callers can reload instantly.
  const broadcastSignal = useCallback((type, key, stamp) => {
    try { localStorage.setItem(key, stamp); } catch { /* ignore */ }
    try {
      const channel = new BroadcastChannel(channelName);
      channel.postMessage({ type, ts: stamp });
      channel.close();
    } catch {
      /* BroadcastChannel unsupported — storage event still delivers */
    }
  }, [channelName]);

  // The admin calls THIS the instant Save Config is clicked. Judges react
  // immediately: card shows the loading spinner + poll ignores ui_cache until
  // notifySaveFinished() fires (saved/failed — flag cleared).
  const notifySaveStarted = useCallback(() => {
    const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    broadcastSignal('UI_GENERATING', signalKey, stamp);
    markUiGenerating();
  }, [broadcastSignal, signalKey, markUiGenerating]);

  // Generic "something changed, please re-fetch" — you MUST NOT clear the
  // generation flag here. A lock toggle or a submitted score while the admin is
  // still generating calls this; clearing the flag would let judges apply the
  // PREVIOUS design from ui_cache mid-generation (the exact stale row the
  // flag exists to ignore).
  const notifyConfigChanged = useCallback(() => {
    const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    broadcastSignal('CONFIG_SAVED', signalKey, stamp);
  }, [broadcastSignal, signalKey]);

  // The admin calls THIS when a Save fully finishes (success, AI failure, or a
  // hard save-config error). Clears the generation flag so judges accept the
  // freshly cached row, then signals the config change.
  const notifySaveFinished = useCallback(() => {
    const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    clearUiGenerating();
    broadcastSignal('CONFIG_SAVED', signalKey, stamp);
  }, [broadcastSignal, signalKey, clearUiGenerating]);

  return (
    <ConfigChangeContext.Provider value={{ changeCount, notifyConfigChanged, notifySaveStarted, notifySaveFinished, schoolId }}>
      {children}
    </ConfigChangeContext.Provider>
  );
};

export default ConfigChangeContext;