import { useState, useEffect, useRef, useCallback } from 'react';
import { useConnectivity } from './useConnectivity';
import { useJudgePersistence } from './useJudgePersistence';
import { getHydra_and_Calcu } from './getHydration_and_Calculation';
import {getSchoolId} from '../../utils/judge'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';


import { sanitizeAiHtml } from './getHydration_and_Calculation';


/* ── Client-side HTML cache helpers ─────────────────────────────── */
function getUiCacheKey(schoolId, criteria) {
  const criteriaSignature = criteria.map(c => `${c.id}:${c.percentage}`).join(',');
  return `ui_html_cache_${schoolId}_${criteriaSignature}`;
}

function saveUiToLocalStorage(schoolId, criteria, ui) {
  try {
    const key = getUiCacheKey(schoolId, criteria);
    localStorage.setItem(key, JSON.stringify({ html: sanitizeAiHtml(ui.html) }));
  } catch (e) {
    console.warn('[UICache] could not save HTML cache:', e.message);
  }
}

function loadUiFromLocalStorage(schoolId, criteria) {
  try {
    const key = getUiCacheKey(schoolId, criteria);
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
  const [selectedJudge, setSelectedJudge] = useState(localStorage.getItem('judge_id') || '');
  const [dynamicUI,     setDynamicUI]     = useState('');
  const [config,        setConfig]        = useState({ contestants: [], criteria: [], settings: {} });
  const [loading,       setLoading]       = useState(false);
  const [modal,         setModal]         = useState({ show: false, title: '', message: '', type: 'success' });

  const uiRendered = useRef(false);

  const isOnline = useConnectivity();
  const { saveToCache, loadCache } = useJudgePersistence(selectedJudge, config.contestants);

  const showStatus = (title, message, type = 'success', onConfirm) =>
    setModal(onConfirm ? { show: true, title, message, type, onConfirm } : { show: true, title, message, type });
  const closeModal = () => setModal(prev => ({ ...prev, show: false }));

  const allScoresFilled = () => {
    const dropdowns = document.querySelectorAll('.score-dropdown');
    return dropdowns.length > 0 &&
      Array.from(dropdowns).every(el => el.value !== '' && el.value !== null);
  };

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

  // ── STEP 1: Fetch config ─────────────────────────────────────────
  useEffect(() => {
    const school_id = getSchoolId();

    const fetchConfig = async () => {
      setLoading(true);
      try {
        const data = await judgeGet(`/public/get-all-data?school_id=${school_id}`);

        if (data && !data.error) {
          const contestants = data.contestants || [];
          const criteria    = data.criteria    || [];
          const settings    = data.settings    || {};

          setConfig({ contestants, criteria, settings });

          // Guard: if settings came back empty, retry once after 1.2 s.
          // Handles the race where a recent save-config hasn't committed yet.
          if (!settings.contest_name && !settings.judge_count) {
            setTimeout(async () => {
              try {
                const d2 = await judgeGet(`/public/get-all-data?school_id=${school_id}`);
                if (d2 && !d2.error) {
                  setConfig({
                    contestants: d2.contestants || [],
                    criteria:    d2.criteria    || [],
                    settings:    d2.settings    || {},
                  });
                }
              } catch { /* silent */ }
            }, 1200);
          }
        } else {
          throw new Error(data.error || 'Failed to load contest config.');
        }
      } catch (err) {
        showStatus('Error', err.message || 'Failed to load contest config.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // ── STEP 2: Render AI UI — localStorage first, cache-only bg sync ─
  useEffect(() => {
    const { contestants, criteria, settings } = config;

    if (!contestants?.length || !criteria?.length) return;
    if (uiRendered.current) return;
    uiRendered.current = true;

    const school_id = getSchoolId();
    const criteriaSignature = criteria
      .map(c => `${c.id}:${c.percentage}`)
      .join(',');

    const renderUI = async () => {
      // 1. localStorage hit → show instantly, sync DB cache in background
      const localCached = loadUiFromLocalStorage(school_id, criteria);
      if (localCached?.html) {
        setDynamicUI(localCached);
        setLoading(false);

        // Background refresh — hits cache-only endpoint, NEVER triggers AI.
        // Only compares html now; headerHtml is rendered statically by the frontend.
        judgeGet(
          `/judge/render-ui-cached?school_id=${school_id}` +
          `&criteria_signature=${encodeURIComponent(criteriaSignature)}`
        )
          .then(data => {
            if (!data.fromCache) return;
            // Only re-render if the AI scoring table itself changed
            if (data.html !== localCached.html) {
              saveUiToLocalStorage(school_id, criteria, data);
              setDynamicUI({ html: data.html });
            }
          })
          .catch(() => {
            // Offline — local cache is already showing, nothing to do
          });

        return;
      }

      // 2. No localStorage → submit job to async queue, then poll until done.
      setLoading(true);
      try {
        // Submit to the async AI queue: API returns a generationId (202) OR a
        // cached render if this exact config was already generated.
        const submitResp = await judgePost('/ai/generate', {
          contestants,
          criteria,
          school_id,
          aiPrompt: settings?.ai_prompt || '',
        });

        // Cached fast-path still returns the html directly.
        if (submitResp.result) {
          const ui = { html: submitResp.result };
          saveUiToLocalStorage(school_id, criteria, ui);
          setDynamicUI(ui);
          setLoading(false);
          return;
        }

        // Queued path: show "Building Interface…" and poll until the job ends.
        if (submitResp.generationId) {
          const result = await pollJobUntilDone(submitResp.generationId, school_id);
          if (result.html) {
            const ui = { html: result.html };
            saveUiToLocalStorage(school_id, criteria, ui);
            setDynamicUI(ui);
          } else {
            showStatus('Error', result.error || 'UI generation failed.', 'error');
          }
        } else {
          showStatus('Error', submitResp.error || 'UI generation failed.', 'error');
        }
      } catch (err) {
        showStatus('Error', err.message || 'Failed to generate judge interface.', 'error');
      } finally {
        setLoading(false);
      }
    };

    renderUI();
  }, [config]);

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
        loadCache
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
        setTimeout(() => window.location.reload(), 2000);
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
      return showStatus('Incomplete Scores', 'Please fill in a score for every contestant before submitting.', 'warning');
    }
    showStatus('Confirm Submission', 'Are you sure you want to submit these scores?', 'confirm', () => {
      closeModal();
      performSubmit();
    });
  };

  // ── Auto-submit: silently submit once every dropdown has a score ──
  useEffect(() => {
    const handleChange = (e) => {
      if (!e.target?.classList?.contains('score-dropdown')) return;
      if (e.target.value === '' || e.target.value === null) return;
      const dropdowns = document.querySelectorAll('.score-dropdown');
      const filled = dropdowns.length > 0 &&
        Array.from(dropdowns).every(el => el.value !== '' && el.value !== null);
      if (filled) performSubmitRef.current();
    };
    document.addEventListener('change', handleChange);
    return () => document.removeEventListener('change', handleChange);
  }, []);

  // ── updateJudge: no reload, re-hydrate only ──────────────────────
  const updateJudge = useCallback((val) => {
    setSelectedJudge(val);
    localStorage.setItem('judge_id', val);
    selectedJudgeRef.current = val;
    window.location.reload();

    if (dynamicUI && config.criteria?.length > 0) {
      getHydra_and_Calcu(
        dynamicUI,
        config,
        saveToCache,
        recalculateRow,
        updateRankings,
        val,
        loadCache
      );
    }
  }, [dynamicUI, config, saveToCache, loadCache]);

  return {
    selectedJudge,
    dynamicUI,
    config,
    loading,
    modal,
    isOnline,
    closeModal,
    submitToDB,
    updateJudge,
  };
};