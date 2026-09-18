import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useConnectivity } from './useConnectivity';
import { useJudgePersistence } from './useJudgePersistence';
import { useConfigChange } from '../context/ConfigChangeContext';
import { getHydra_and_Calcu, sanitizeAiHtml } from './getHydration_and_Calculation';
import { buildStaticJudgeTable as buildRichStaticTable } from '../utils/judgeTable';
import { getSchoolId, getJudgeToken } from '../utils/judge';
import { rankValues, formatRank } from '../utils/ranks';
import { refreshAccessToken, clearJudgeSession, redirectToLogin } from '../services/session';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/* ── Client-side config cache helpers ────────────────────────────── */
// DISABLED FOR TESTING — always treat as different, no localStorage
function configsMatch() {
  return false;
}

function saveConfigToLocalStorage() {
  // no-op
}

function loadConfigFromLocalStorage() {
  return null;
}

// Only the fields below drive the judge's rendered table. Ignoring the rest
// (e.g. is_judge_locked toggles) prevents a pointless overlay flash while a
// polled config update is still applied.
function renderRelevantChanged(a, b) {
  const sig = (c) =>
    JSON.stringify({
      contestants: c.contestants || [],
      criteria:    c.criteria    || [],
      settings: {
        ai_prompt:   c.settings?.ai_prompt   || '',
        ai_provider: c.settings?.ai_provider || 'groq',
        ai_model:    c.settings?.ai_model    || 'openai/gpt-oss-120b',
        ui_mode:     c.settings?.ui_mode     || 'ai',
      },
    });
  return sig(a) !== sig(b);
}

/* ── Plain fetch helpers with the judge JWT ─────────────────────── */
function judgeAuthHeader() {
  const token = getJudgeToken(getSchoolId()) || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function judgePost(path, body, timeoutMs, cancelledRef) {
  const controller = new AbortController();
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;

  const onExternalCancel = () => controller.abort();
  if (cancelledRef?.current) {
    onExternalCancel();
  }

  try {
    let res = await fetch(`${API_BASE}${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...judgeAuthHeader() },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    });

    if (res.status === 401 && !cancelledRef?.current) {
      let refreshed = true;
      try {
        await refreshAccessToken('judge');
      } catch {
        refreshed = false;
        clearJudgeSession();
        redirectToLogin('judge');
      }
      if (refreshed) {
        res = await fetch(`${API_BASE}${path}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', ...judgeAuthHeader() },
          body:    JSON.stringify(body),
          signal:  controller.signal,
        });
      }
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error('Request timed out — showing the standard table.');
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function judgeGet(path, timeoutMs) {
  const controller = new AbortController();
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    let res = await fetch(`${API_BASE}${path}`, {
      headers: judgeAuthHeader(),
      signal:  controller.signal,
    });

    if (res.status === 401) {
      let refreshed = true;
      try {
        await refreshAccessToken('judge');
      } catch {
        refreshed = false;
        clearJudgeSession();
        redirectToLogin('judge');
      }
      if (refreshed) {
        res = await fetch(`${API_BASE}${path}`, {
          headers: judgeAuthHeader(),
          signal:  controller.signal,
        });
      }
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error('Request timed out — showing the standard table.');
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/* ── Small timeout wrapper ──────────────────────────────────────── */
const withTimeout = (promise, ms = 12000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out — showing the standard table.')), ms)
    ),
  ]);

/* ── Hook ────────────────────────────────────────────────────────── */
export const useJudgeSystem = () => {
  const schoolId = getSchoolId();

  const [selectedJudge, setSelectedJudge] = useState(localStorage.getItem(`judge_id_${schoolId}`) || '');
  const [dynamicUI,     setDynamicUI]     = useState('');
  const [config,        setConfig]        = useState({ contestants: [], criteria: [], settings: {} });
  const [loading,       setLoading]       = useState(false);
  const [uiRefreshing,  setUiRefreshing]  = useState(false);
  const [waitSeconds,   setWaitSeconds]   = useState(0);
  const [isComplete,    setIsComplete]    = useState(false);
  const [modal,         setModal]         = useState({ show: false, title: '', message: '', type: 'success' });
// Kept only as a momentary gate before STEP 2 renders the built-in scoring
  // table. The judge is never left on an endless "being generated" screen —
  // if the admin's design isn't cached yet, the standard table shows and swaps
  // in automatically when the design is ready.
  const [uiPending, setUiPending] = useState(false);

  const isOnline = useConnectivity();
  const { saveToCache, loadCache } = useJudgePersistence(selectedJudge, config.contestants, schoolId);

  const { changeCount: configChangeCount } = useConfigChange();

  // ── Refs that must exist before any effect / callback closes over them ──
  const selectedJudgeRef = useRef(selectedJudge);
  const configRef        = useRef(config);
  const dynamicUIRef     = useRef('');

  configRef.current = config;

  useEffect(() => {
    selectedJudgeRef.current = selectedJudge;
  }, [selectedJudge]);

  useEffect(() => {
    dynamicUIRef.current = typeof dynamicUI === 'string' ? dynamicUI : (dynamicUI?.html || '');
  }, [dynamicUI]);

  const showStatus = (title, message, type = 'success', onConfirm) =>
    setModal(onConfirm ? { show: true, title, message, type, onConfirm } : { show: true, title, message, type });

  const closeModal = () => {
    setModal(prev => ({ ...prev, show: false }));
    setTimeout(restoreScores, 0);
  };

  // ── Wait timer: shows elapsed seconds on the judge spinner ──────
  useEffect(() => {
    if (loading || uiRefreshing) {
      setWaitSeconds(0);
      const id = setInterval(() => setWaitSeconds(s => s + 1), 1000);
      return () => clearInterval(id);
    }
    setWaitSeconds(0);
  }, [loading, uiRefreshing]);

  const allScoresFilled = useCallback(() => {
    const dropdowns = document.querySelectorAll('.score-dropdown');
    return dropdowns.length > 0 &&
      Array.from(dropdowns).every(el => el.value !== '' && el.value !== null);
  }, []);

  const evaluateCompleteness = useCallback(() => {
    setIsComplete(allScoresFilled());
  }, [allScoresFilled]);

  const recalculateRow = (contestantId) => {
    const scores = document.querySelectorAll(`[id^="score-${contestantId}-"]`);
    const sum    = Array.from(scores).reduce((acc, s) => acc + (parseFloat(s.value) || 0), 0);
    const cell   = document.getElementById(`total-${contestantId}`);
    if (cell) cell.innerText = sum.toFixed(2);
  };

  const updateRankings = () => {
    if (!config.contestants?.length) return;
    const rows = config.contestants
      .map(c => ({
        id:    c.id,
        total: parseFloat(document.getElementById(`total-${c.id}`)?.innerText || 0),
      }))
      .filter(item => item.total > 0)
      .map(item => ({ ...item, value: item.total }));

    rankValues(rows, { method: 'midrank', ascending: false });

    rows.forEach(item => {
      const cell = document.getElementById(`rank-${item.id}`);
      if (cell) cell.innerText = formatRank(item.rank);
    });
  };

  const restoreScores = useCallback(() => {
    if (!dynamicUI || !config.criteria?.length || !selectedJudgeRef.current) {
      return;
    }
    getHydra_and_Calcu(
      dynamicUI,
      config,
      saveToCache,
      recalculateRow,
      updateRankings,
      selectedJudgeRef.current,
      loadCache,
      schoolId
    );
  }, [dynamicUI, config, saveToCache, loadCache, schoolId]);

  // ── STEP 1: Load config — cache first (instant), then background sync ─
  useEffect(() => {
    const school_id = getSchoolId();

    const cached = loadConfigFromLocalStorage(school_id);
    if (cached) {
      setConfig(cached);
      setLoading(false);
    }

    const fetchConfig = async () => {
      if (!cached) setLoading(true);
      try {
        const data = await judgeGet(`/public/get-all-data?school_id=${school_id}`, 12000);

        if (data && !data.error) {
          const contestants = data.contestants || [];
          const criteria    = data.criteria    || [];
          const settings    = data.settings    || {};

          const fresh = { contestants, criteria, settings };
          saveConfigToLocalStorage(school_id, fresh);

          setConfig(prev => {
            if (configsMatch(prev, fresh)) return prev;
            return fresh;
          });

          if (!settings.contest_name && !settings.judge_count) {
            setTimeout(async () => {
              try {
                const d2 = await judgeGet(`/public/get-all-data?school_id=${school_id}`, 12000);
                if (d2 && !d2.error) {
                  const contestants2 = d2.contestants || [];
                  const criteria2    = d2.criteria    || [];
                  const settings2    = d2.settings    || {};
                  const fresh2 = { contestants: contestants2, criteria: criteria2, settings: settings2 };
                  saveConfigToLocalStorage(school_id, fresh2);
                  setConfig(prev => (configsMatch(prev, fresh2) ? prev : fresh2));
                }
              } catch { /* silent */ }
            }, 1200);
          }
        } else {
          if (!cached) throw new Error(data.error || 'Failed to load contest config.');
        }
      } catch (err) {
        if (!cached) showStatus('Error', err.message || 'Failed to load contest config.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // ── STEP 1b: Keep the judge in sync with admin saves ─────────────────────
  const configSyncBusyRef = useRef(false);
  const uiRendered        = useRef('');

  useEffect(() => {
    const syncNow = async () => {
      if (configSyncBusyRef.current) return;
      configSyncBusyRef.current = true;
      try {
        console.log(`🔄 [syncNow] fetching config school=${schoolId} trigger=configChangeCount:${configChangeCount}`);
        const data = await withTimeout(
          judgeGet(`/public/get-all-data?school_id=${schoolId}`),
          12000
        );
        if (!data || data.error) {
          console.log(`⚠️ [syncNow] no data or error school=${schoolId}`);
          return;
        }

        const fresh = {
          contestants: data.contestants || [],
          criteria:    data.criteria    || [],
          settings:    data.settings    || {},
        };
        console.log(`📥 [syncNow] fresh config school=${schoolId} uiMode=${fresh.settings?.ui_mode} prompt="${fresh.settings?.ai_prompt?.slice(0,40)}..." model=${fresh.settings?.ai_model} contestants=${fresh.contestants.length} criteria=${fresh.criteria.length}`);
        saveConfigToLocalStorage(schoolId, fresh);

        if (configsMatch(configRef.current, fresh)) {
          console.log(`⏭️ [syncNow] configsMatch=true — no change school=${schoolId}`);
          return;
        }

        if (renderRelevantChanged(configRef.current, fresh)) {
          console.log(`🎨 [syncNow] renderRelevantChanged=true — showing overlay school=${schoolId}`);
          const hasTable = !!dynamicUIRef.current;
          uiRendered.current = '';
          setLoading(!hasTable);
          setUiRefreshing(hasTable);
        } else {
          console.log(`📝 [syncNow] config changed but not render-relevant (e.g. lock toggle) school=${schoolId}`);
        }
        setConfig(fresh);
      } catch (err) {
        console.error(`❌ [syncNow] error school=${schoolId}:`, err.message);
      } finally {
        configSyncBusyRef.current = false;
      }
    };

    if (configChangeCount > 0) {
      console.log(`🔔 [syncNow] triggered by configChangeCount=${configChangeCount}`);
      syncNow();
    }

    const id = setInterval(syncNow, 5000);
    return () => clearInterval(id);
  }, [configChangeCount, schoolId]);

  // ── STEP 2: Render the judge UI — default mode builds instantly, AI mode
  //            only waits for the design the admin already generated ─────────
  const renderSignature = useMemo(() => {
    const { criteria, settings } = config;
    const criteriaSignature = (criteria || [])
      .map(c => `${c.id}:${c.percentage}`)
      .join(',');
    const aiPrompt   = settings?.ai_prompt   || '';
    const aiProvider = settings?.ai_provider || 'groq';
    const aiModel    = settings?.ai_model    || 'openai/gpt-oss-120b';
    const uiMode     = settings?.ui_mode     || 'ai';
    return `${criteriaSignature}::${aiProvider}::${aiPrompt}::${aiModel}::${uiMode}`;
  }, [config]);

  useEffect(() => {
    const { contestants, criteria, settings } = config;

    if (!contestants?.length || !criteria?.length) {
      // Nothing to render → never leave STEP 1b's loader/overlay hanging.
      setLoading(false);
      setUiRefreshing(false);
      setUiPending(false);
      return;
    }

    if (uiRendered.current === renderSignature) {
      setUiRefreshing(false);
      return;
    }
    uiRendered.current = renderSignature;

    const uiMode = settings?.ui_mode || 'ai';

    // Default mode: the built-in table IS the design. Rendered instantly on
    // the client (same rich builder the admin previews), never waits for the
    // AI pipeline, never shows a placeholder.
    if (uiMode === 'default') {
      const staticTable = buildRichStaticTable(
        contestants,
        criteria,
        selectedJudgeRef.current ? `Judge ${selectedJudgeRef.current}` : undefined
      );
      if (staticTable) {
        setDynamicUI(prev => (prev?.html === staticTable ? prev : { html: staticTable }));
      }
      setLoading(false);
      setUiRefreshing(false);
      setUiPending(false);
      return;
    }

    // AI mode: the design lives in ui_cache on the server (the admin generates
    // it from the dashboard's Save button). The judge NEVER calls the AI — it
    // only polls until the cache is ready. Reaching this branch means nothing
    // is on screen yet OR the on-screen table belongs to a different (stale)
    // signature — in both cases render the built-in scoring table IMMEDIATELY
    // so judges are never stuck on a blank placeholder. The poll below swaps
    // in the admin's AI design the moment it lands in ui_cache.
    const hasPrevious = !!dynamicUIRef.current;
    setLoading(false);
    setUiRefreshing(hasPrevious);
    setUiPending(false);
    const fallback = buildRichStaticTable(
      contestants,
      criteria,
      selectedJudgeRef.current ? `Judge ${selectedJudgeRef.current}` : undefined
    );
    if (fallback) setDynamicUI(prev => (prev?.html === fallback ? prev : { html: fallback }));
  }, [config, renderSignature]);

  // Poll the admin-generated ui_cache until a design matching our
  // provider/prompt/model/criteria signature is available. Pure consumer — the
  // admin writes BOTH AI designs and the static Default UI into ui_cache on
  // save, so this polls for both modes. Until the design lands, the built-in
  // scoring table stays on screen (built in STEP 2 / this poll) and is
  // auto-replaced the moment the admin's design is cached.
  useEffect(() => {
    const { contestants, criteria, settings } = configRef.current;
    if (!contestants?.length || !criteria?.length) return;
    const uiMode = settings?.ui_mode || 'ai';
    if (uiMode !== 'ai' && uiMode !== 'default') return;

    const school_id = getSchoolId();
    const criteriaSignature = criteria
      .map(c => `${c.id}:${c.percentage}`)
      .join(',');
    const aiPrompt   = settings?.ai_prompt   || '';
    const aiProvider = settings?.ai_provider || 'groq';
    const aiModel    = settings?.ai_model    || 'openai/gpt-oss-120b';
    const cachedUrl =
      `/judge/render-ui-cached?school_id=${school_id}` +
      `&criteria_signature=${encodeURIComponent(criteriaSignature)}` +
      `&prompt=${encodeURIComponent(aiPrompt)}` +
      `&provider=${encodeURIComponent(aiProvider)}` +
      `&model=${encodeURIComponent(aiModel)}` +
      `&ui_mode=${encodeURIComponent(uiMode)}`;

    let cancelled = false;
    let timer = null;

    const poll = async () => {
      if (cancelled) return;
      try {
        const cached = await withTimeout(judgeGet(cachedUrl, 12000), 12000);
        if (cancelled) return;
        if (cached.fromCache === true && cached.html) {
          let html = sanitizeAiHtml(cached.html, criteria);
          // The AI sometimes returns a decorative "GUI" with no scoring inputs
          // at all. Never let the judge end up dropdown-less — fall back to the
          // exact same built-in table used by Default mode so AI designs always
          // render the standard scoring layout (dropdowns per criterion).
          if (!html.includes('score-dropdown')) {
            html = buildRichStaticTable(
              contestants,
              criteria,
              selectedJudgeRef.current ? `Judge ${selectedJudgeRef.current}` : undefined
            );
          }
          setDynamicUI(prev => (prev?.html === html ? prev : { html }));
          setUiPending(false);
          setUiRefreshing(false);
          console.log(`🎨 [judge-poll] cached ${uiMode} UI ready school=${school_id} len=${html.length}`);
          return; // design received — stop polling
        }
        // Not cached yet. If nothing is on screen (e.g. the judge page opened
        // right as the admin is generating), render the built-in scoring table
        // immediately so it's never stuck — the design below auto-swaps in once
        // the admin's generation lands in ui_cache.
        if (!dynamicUIRef.current && uiMode === 'ai') {
          const fallback = buildRichStaticTable(
            contestants,
            criteria,
            selectedJudgeRef.current ? `Judge ${selectedJudgeRef.current}` : undefined
          );
          if (fallback) setDynamicUI(prev => (prev?.html === fallback ? prev : { html: fallback }));
        }
        setUiPending(false);
        console.log(`⏳ [judge-poll] ui_cache still generating school=${school_id} — retrying…`);
        timer = setTimeout(poll, 4000);
      } catch (err) {
        if (cancelled) return;
        console.warn(`⏳ [judge-poll] fetch error (${err.message}) — retrying school=${school_id}`);
        setUiPending(false);
        timer = setTimeout(poll, 6000);
      }
    };

    timer = setTimeout(poll, 0);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [renderSignature]);

  // ── STEP 3: Hydrate UI whenever dynamicUI or selectedJudge changes ─────
  useEffect(() => {
    if (dynamicUI && config.criteria?.length > 0) {
      getHydra_and_Calcu(
        dynamicUI,
        config,
        saveToCache,
        recalculateRow,
        updateRankings,
        selectedJudgeRef.current,
        loadCache,
        schoolId
      );
    }
  }, [dynamicUI, config]);

  // ── Submit scores ────────────────────────────────────────────────
  const submittingRef = useRef(false);
  const performSubmitRef = useRef(null);

  const performSubmit = async () => {
    if (submittingRef.current) return;
    if (!selectedJudge) return showStatus('Error', 'Please select a judge.', 'error');

    if (!allScoresFilled()) {
      return showStatus('Incomplete Scores', 'Please fill in a score for every contestant before submitting.', 'warning');
    }

    const school_id     = getSchoolId();
    const scoreElements = document.querySelectorAll('.score-dropdown');

    if (!scoreElements.length) {
      return showStatus('Error', 'No scores found to submit.', 'error');
    }

    submittingRef.current = true;
    setLoading(true);

    const scores = Array.from(scoreElements).map(el => {
      const [, contestantId, criterionId] = el.id.split('-');
      return {
        contestantId: parseInt(contestantId),
        criterionId:  parseInt(criterionId),
        value:        parseFloat(el.value) || 0,
      };
    });

    try {
      const data = await judgePost('/judge/submit', {
        judgeId: selectedJudge,
        scores,
        school_id,
      }, 15000);

      if (data.success) {
        getHydra_and_Calcu(
          dynamicUI,
          config,
          saveToCache,
          recalculateRow,
          updateRankings,
          selectedJudge,
          loadCache,
          school_id
        );
        showStatus('Success', 'Scores submitted successfully!', 'success');
      }
    } catch (err) {
      showStatus('Error', err.message || 'Failed to connect to server.', 'error');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  performSubmitRef.current = performSubmit;

  const submitToDB = () => {
    if (!selectedJudge) return showStatus('Error', 'Please select a judge.', 'error');
    if (!allScoresFilled()) {
      return showStatus('Incomplete Scores', 'Please complete the scoring before submitting.', 'warning');
    }
    showStatus('Confirm Submission', 'Are you sure you want to submit these scores?', 'confirm', () => {
      closeModal();
      performSubmit();
    });
  };

  useEffect(() => {
    const handleChange = (e) => {
      if (!e.target?.classList?.contains('score-dropdown')) return;
      evaluateCompleteness();
      if (e.target.value === '' || e.target.value === null) return;
      const dropdowns = document.querySelectorAll('.score-dropdown');
      const filled = dropdowns.length > 0 &&
        Array.from(dropdowns).every(el => el.value !== '' && el.value !== null);
      if (filled) performSubmitRef.current();
    };
    document.addEventListener('change', handleChange);
    return () => document.removeEventListener('change', handleChange);
  }, [evaluateCompleteness]);

  useEffect(() => {
    if (!dynamicUI) return;
    const t = setTimeout(() => evaluateCompleteness(), 500);
    return () => clearTimeout(t);
  }, [dynamicUI, evaluateCompleteness]);

  const updateJudge = useCallback((val) => {
    if (!val) return;

    setSelectedJudge(val);
    localStorage.setItem(`judge_id_${schoolId}`, val);
    selectedJudgeRef.current = val;

    if (dynamicUI && config.criteria?.length > 0) {
      getHydra_and_Calcu(
        dynamicUI,
        config,
        saveToCache,
        recalculateRow,
        updateRankings,
        val,
        [],
        schoolId
      );
    }
  }, [dynamicUI, config, saveToCache, schoolId]);

  return {
    selectedJudge,
    dynamicUI,
    config,
    loading,
    uiRefreshing,
    uiPending,
    waitSeconds,
    isComplete,
    modal,
    isOnline,
    closeModal,
    submitToDB,
    updateJudge,
  };
};