import { useState, useEffect, useRef, useCallback } from 'react';
import { useConnectivity } from './useConnectivity';
import { useJudgePersistence } from './useJudgePersistence';
import { useConfigChange } from '../../providers/ConfigChangeContext';
import { getHydra_and_Calcu } from './getHydration_and_Calculation';
import {getSchoolId} from '../../utils/judge'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';


import { sanitizeAiHtml } from './getHydration_and_Calculation';


/* ── Client-side HTML cache helpers ─────────────────────────────── */
function getUiCacheKey(schoolId, criteria, aiPrompt) {
  const criteriaSignature = criteria.map(c => `${c.id}:${c.percentage}`).join(',');
  const promptSlug = (aiPrompt || 'default').slice(0, 64);
  return `ui_html_cache_${schoolId}_${criteriaSignature}_${promptSlug}`;
}

function saveUiToLocalStorage(schoolId, criteria, ui, aiPrompt) {
  try {
    const key = getUiCacheKey(schoolId, criteria, aiPrompt);
    localStorage.setItem(key, JSON.stringify({ html: sanitizeAiHtml(ui.html) }));
  } catch (e) {
    console.warn('[UICache] could not save HTML cache:', e.message);
  }
}

function loadUiFromLocalStorage(schoolId, criteria, aiPrompt) {
  try {
    const key = getUiCacheKey(schoolId, criteria, aiPrompt);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.html) {
      parsed.html = sanitizeAiHtml(parsed.html);
    }
    return parsed;
  } catch {
    return null;
  }
}

/* ── Client-side config cache helpers ────────────────────────────── */
function configsMatch(a, b) {
  if (!a || !b) return false;
  const sig = (c) =>
    JSON.stringify({
      contestants: c.contestants || [],
      criteria:    c.criteria    || [],
      settings:    c.settings    || {},
    });
  return sig(a) === sig(b);
}

function getConfigCacheKey(schoolId) {
  return `judge_config_cache_${schoolId}`;
}

function saveConfigToLocalStorage(schoolId, config) {
  try {
    localStorage.setItem(getConfigCacheKey(schoolId), JSON.stringify(config));
  } catch (e) {
    console.warn('[ConfigCache] could not save config cache:', e.message);
  }
}

function loadConfigFromLocalStorage(schoolId) {
  try {
    const raw = localStorage.getItem(getConfigCacheKey(schoolId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.criteria)) return null;
    return {
      contestants: Array.isArray(parsed.contestants) ? parsed.contestants : [],
      criteria:    parsed.criteria,
      settings:    parsed.settings || {},
    };
  } catch {
    return null;
  }
}

/* ── Plain fetch helpers (no JWT needed for judge routes) ────────── */
async function judgePost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function judgeGet(path) {
  const res  = await fetch(`${API_BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

/* ── AI UI generation (async job queue) ─────────────────────────── */
const AI_POLL_INTERVAL_MS  = 2000;
const AI_POLL_MAX_ATTEMPTS = 100;

// Polls a queued AI generation job until it COMPLETES, FAILS, or gives up.
// Returns { html } on success or { error } otherwise.
async function pollJobUntilDone(jobId, schoolId, cancelledRef) {
  const url = `/ai/generations/${jobId}?school_id=${encodeURIComponent(schoolId)}`;
  for (let attempt = 0; attempt < AI_POLL_MAX_ATTEMPTS; attempt++) {
    if (cancelledRef?.current) return { error: 'Generation cancelled.' };
    let status;
    try {
      status = await judgeGet(url);
    } catch (err) {
      return { error: err.message || 'Failed to check generation status.' };
    }
    if (status?.status === 'COMPLETED' && status.result) return { html: status.result };
    if (status?.status === 'FAILED') return { error: status.error || 'AI generation failed.' };
    await new Promise(r => setTimeout(r, AI_POLL_INTERVAL_MS));
  }
  return { error: 'AI generation is taking too long. Please try again.' };
}

/* ── Hook ────────────────────────────────────────────────────────── */
export const useJudgeSystem = () => {
  const schoolId = getSchoolId();

  const [selectedJudge, setSelectedJudge] = useState(localStorage.getItem(`judge_id_${schoolId}`) || '');
  const [dynamicUI,     setDynamicUI]     = useState('');
  const [config,        setConfig]        = useState({ contestants: [], criteria: [], settings: {} });
  const [loading,       setLoading]       = useState(false);
  const [uiRefreshing,  setUiRefreshing]  = useState(false);
  const [isComplete,    setIsComplete]    = useState(false);
  const [modal,         setModal]         = useState({ show: false, title: '', message: '', type: 'success' });

  const isOnline = useConnectivity();
  const { saveToCache, loadCache } = useJudgePersistence(selectedJudge, config.contestants, schoolId);

  const { changeCount: configChangeCount } = useConfigChange();

  const showStatus = (title, message, type = 'success', onConfirm) =>
    setModal(onConfirm ? { show: true, title, message, type, onConfirm } : { show: true, title, message, type });
  const closeModal = () => setModal(prev => ({ ...prev, show: false }));

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
    const standings = config.contestants
      .map(c => ({
        id:    c.id,
        total: parseFloat(document.getElementById(`total-${c.id}`)?.innerText || 0),
      }))
      .sort((a, b) => b.total - a.total);

    standings.forEach((item, idx) => {
      const cell = document.getElementById(`rank-${item.id}`);
      if (cell && item.total > 0) {
        const rank = idx + 1;
        const sfx  = ['th', 'st', 'nd', 'rd'][
          (rank % 10 > 3 || Math.floor(rank % 100 / 10) === 1) ? 0 : rank % 10
        ];
        cell.innerText = `${rank}${sfx}`;
      }
    });
  };

  // ── STEP 1: Load config — cache first (instant), then background sync ─
  useEffect(() => {
    const school_id = getSchoolId();

    // 1. If we have a cached config, use it immediately so the page renders
    //    without a loader (no network round-trip on reload). The UI cache in
    //    STEP 2 keys on the criteria signature, so this stays in sync.
    const cached = loadConfigFromLocalStorage(school_id);
    if (cached) {
      setConfig(cached);
      setLoading(false);
    }

    const fetchConfig = async () => {
      // Show the loader ONLY when we have nothing cached to render.
      if (!cached) setLoading(true);
      try {
        const data = await judgeGet(`/public/get-all-data?school_id=${school_id}`);

        if (data && !data.error) {
          const contestants = data.contestants || [];
          const criteria    = data.criteria    || [];
          const settings    = data.settings    || {};

          const fresh = { contestants, criteria, settings };
          saveConfigToLocalStorage(school_id, fresh);

          // Only update state if the config actually changed (avoids needless
          // re-renders / AI re-hydration on every poll or reload).
          setConfig(prev => {
            if (configsMatch(prev, fresh)) return prev;
            return fresh;
          });

          // Guard: if settings came back empty, retry once after 1.2 s.
          // Handles the race where a recent save-config hasn't committed yet.
          if (!settings.contest_name && !settings.judge_count) {
            setTimeout(async () => {
              try {
                const d2 = await judgeGet(`/public/get-all-data?school_id=${school_id}`);
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
        // If we already have a cached config, stay silent (offline / transient).
        if (!cached) showStatus('Error', err.message || 'Failed to load contest config.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // ── STEP 1b: Config saved in admin tab → show spinner + re-fetch instantly ─
  // changeCount starts at 0 on mount; every admin save bumps it via the
  // cross-tab ConfigChangeProvider (BroadcastChannel + storage fallback).
  const uiRendered = useRef('');
  const dynamicUIRef = useRef('');
  useEffect(() => {
    dynamicUIRef.current = typeof dynamicUI === 'string' ? dynamicUI : (dynamicUI?.html || '');
  }, [dynamicUI]);

  useEffect(() => {
    if (configChangeCount === 0) return;

    // If a table is already on screen, keep it visible under the refresh
    // overlay instead of blocking the whole page with the full loader.
    const hasTable = !!dynamicUIRef.current;
    setLoading(!hasTable);
    setUiRefreshing(hasTable);

    // Reset the render guard so STEP 2 re-runs with the new config
    uiRendered.current = '';

    // Re-fetch config from server to get the latest settings/contestants/criteria
    judgeGet(`/public/get-all-data?school_id=${schoolId}`)
      .then(data => {
        if (data && !data.error) {
          const fresh = {
            contestants: data.contestants || [],
            criteria:    data.criteria    || [],
            settings:    data.settings    || {},
          };
          saveConfigToLocalStorage(schoolId, fresh);
          setConfig(fresh);
        }
      })
      .catch(() => {
        // Even if the fetch fails, STEP 2 will still run with the current config
        setLoading(false);
      });
  }, [configChangeCount, schoolId]);

  // ── STEP 2: Render AI UI — localStorage first, cache-only bg sync ─
  useEffect(() => {
    const { contestants, criteria, settings } = config;

    if (!contestants?.length || !criteria?.length) return;

    const school_id = getSchoolId();
    const criteriaSignature = criteria
      .map(c => `${c.id}:${c.percentage}`)
      .join(',');
    const aiPrompt = settings?.ai_prompt || '';
    const renderSignature = `${criteriaSignature}::${aiPrompt}`;

    // Re-run only when the actual config signature changes (admin edits, etc.),
    // so unchanged configs don't cause redundant regenerations.
    if (uiRendered.current === renderSignature) return;
    uiRendered.current = renderSignature;

    const renderUI = async () => {
      // 1. localStorage hit → show instantly, sync DB cache in background
      const localCached = loadUiFromLocalStorage(school_id, criteria, aiPrompt);
      if (localCached?.html) {
        // Only re-render if the incoming UI differs from what's on screen now,
        // so unchanged configs don't flash the table.
        setDynamicUI(prev => (prev?.html === localCached.html ? prev : localCached));
        setLoading(false);

        // Background refresh — hits cache-only endpoint, NEVER triggers AI here.
        judgeGet(
          `/judge/render-ui-cached?school_id=${school_id}` +
          `&criteria_signature=${encodeURIComponent(criteriaSignature)}`
        )
          .then(data => {
            if (!data.fromCache) {
              // Admin changed the config — no DB cache for the new signature yet.
              // Generate (and cache) the new table in the background so the
              // judge page self-updates without requiring a manual reload.
              setUiRefreshing(true);
              return ensureCachedUi(contestants, criteria, settings, school_id, true)
                .then(ui => {
                  if (ui?.html) {
                    saveUiToLocalStorage(school_id, criteria, ui, aiPrompt);
                    setDynamicUI(prev => (prev?.html === ui.html ? prev : ui));
                  }
                })
                .finally(() => setUiRefreshing(false));
            }
            if (data.html && data.html !== localCached.html) {
              saveUiToLocalStorage(school_id, criteria, data, aiPrompt);
              setDynamicUI({ html: data.html });
            }
          })
          .catch(() => {
            // Offline — local cache is already showing, nothing to do
          });

        return;
      }

      // 2. No local cache → ensure a server render exists for this config.
      const hasTable = !!dynamicUIRef.current;
      if (hasTable) {
        // Keep the current table on screen and generate in the background,
        // so the judge never sits on a blank "Building interface…" screen
        // while the AI job runs (its previous table is still useful).
        setUiRefreshing(true);
        try {
          const ui = await ensureCachedUi(contestants, criteria, settings, school_id, true);
          if (ui?.html) {
            saveUiToLocalStorage(school_id, criteria, ui, aiPrompt);
            setDynamicUI(ui);
          }
        } finally {
          setUiRefreshing(false);
        }
        return;
      }

      setLoading(true);
      try {
        const ui = await ensureCachedUi(contestants, criteria, settings, school_id);
        if (ui?.html) {
          saveUiToLocalStorage(school_id, criteria, ui, aiPrompt);
          setDynamicUI(ui);
        }
      } catch (err) {
        showStatus('Error', err.message || 'Failed to generate judge interface.', 'error');
      } finally {
        setLoading(false);
      }
    };

    renderUI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, uiRendered]);

  // Generate-or-fetch the AI table for the given config, caching locally.
  // When `silent` is true the caller already manages the loading indication
  // (e.g. the refresh overlay), so this never flips the full-screen loader.
  const ensureCachedUi = async (contestants, criteria, settings, school_id, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const submitResp = await judgePost('/ai/generate', {
        contestants,
        criteria,
        school_id,
        aiPrompt: settings?.ai_prompt || '',
      });

      // Cached fast-path returns the html directly.
      if (submitResp.result) {
        return { html: submitResp.result };
      }

      // Queued path: poll until the job ends.
      if (submitResp.generationId) {
        const result = await pollJobUntilDone(submitResp.generationId, school_id);
        if (result.html) return { html: result.html };
        showStatus('Error', result.error || 'UI generation failed.', 'error');
        return null;
      }

      showStatus('Error', submitResp.error || 'UI generation failed.', 'error');
      return null;
    } catch (err) {
      showStatus('Error', err.message || 'Failed to generate judge interface.', 'error');
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ── STEP 3: Hydrate UI whenever dynamicUI or selectedJudge changes ─
  const selectedJudgeRef = useRef(selectedJudge);
  useEffect(() => {
    selectedJudgeRef.current = selectedJudge;
  }, [selectedJudge]);

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
      });

      if (data.success) {
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

  // ── Manual submit (button): confirm first, block if incomplete ──
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

  // ── Completeness + auto-submit: update the live "complete" indicator on
  //    every score change, and silently submit once every dropdown is filled ──
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

  // Re-check completeness shortly after the score table first renders so the
  // button reflects any values already saved in localStorage for this judge.
  useEffect(() => {
    if (!dynamicUI) return;
    const t = setTimeout(() => evaluateCompleteness(), 500);
    return () => clearTimeout(t);
  }, [dynamicUI, evaluateCompleteness]);

  // ── updateJudge: no reload — switch judge in place ──
  // Switches to the selected judge WITHOUT wiping their previously saved
  // values, so scores are remembered even across switch/reload/offline.
  const updateJudge = useCallback((val) => {
    if (!val) return;

    setSelectedJudge(val);
    localStorage.setItem(`judge_id_${schoolId}`, val);
    selectedJudgeRef.current = val;

    // Re-hydrate the table for the newly selected judge, restoring whatever
    // they had saved in localStorage (empty if they never entered anything).
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
  }, [dynamicUI, config, saveToCache, recalculateRow, updateRankings, schoolId]);

  return {
    selectedJudge,
    dynamicUI,
    config,
    loading,
    uiRefreshing,
    isComplete,
    modal,
    isOnline,
    closeModal,
    submitToDB,
    updateJudge,
  };
};