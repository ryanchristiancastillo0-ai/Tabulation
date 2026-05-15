import { useState, useEffect, useRef, useCallback } from 'react';
import { useConnectivity } from './useConnectivity';
import { useJudgePersistence } from './useJudgePersistence';
import { getHydra_and_Calcu } from './getHydration_and_Calculation';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/* ── Utility ─────────────────────────────────────────────────────── */
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

/* ── Client-side HTML cache helpers ─────────────────────────────── */
function getUiCacheKey(schoolId, criteria) {
  const criteriaSignature = criteria.map(c => `${c.id}:${c.percentage}`).join(',');
  return `ui_html_cache_${schoolId}_${criteriaSignature}`;
}

function saveUiToLocalStorage(schoolId, criteria, ui) {
  try {
    const key = getUiCacheKey(schoolId, criteria);
    localStorage.setItem(key, JSON.stringify(ui));
  } catch (e) {
    console.warn('[UICache] could not save HTML cache:', e.message);
  }
}

function loadUiFromLocalStorage(schoolId, criteria) {
  try {
    const key = getUiCacheKey(schoolId, criteria);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
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

  const showStatus = (title, message, type = 'success') =>
    setModal({ show: true, title, message, type });
  const closeModal = () => setModal(prev => ({ ...prev, show: false }));

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

        // Background refresh — hits cache-only endpoint, NEVER triggers AI
        judgeGet(
          `/judge/render-ui-cached?school_id=${school_id}` +
          `&criteria_signature=${encodeURIComponent(criteriaSignature)}`
        )
          .then(data => {
            if (!data.fromCache) return;
            const changed =
              data.html       !== localCached.html ||
              data.headerHtml !== localCached.headerHtml;
            if (changed) {
              saveUiToLocalStorage(school_id, criteria, data);
              setDynamicUI(data);
            }
          })
          .catch(() => {
            // Offline — local cache is already showing, nothing to do
          });

        return;
      }

      // 2. No localStorage → full POST (DB cache hit or AI generation)
      setLoading(true);
      try {
        const data = await judgePost('/judge/render-ui', {
          contestants,
          criteria,
          school_id,
          aiPrompt: settings?.ai_prompt || '',
        });

        if (data.html || data.headerHtml) {
          saveUiToLocalStorage(school_id, criteria, data);
          setDynamicUI(data);
        } else {
          showStatus('Error', data.error || 'UI generation failed.', 'error');
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
  const submitToDB = async () => {
    if (!selectedJudge) return showStatus('Error', 'Please select a judge.', 'error');

    const school_id     = getSchoolId();
    const scoreElements = document.querySelectorAll('.score-dropdown');

    if (!scoreElements.length) {
      return showStatus('Error', 'No scores found to submit.', 'error');
    }

    const scores = Array.from(scoreElements).map(el => {
      const [, contestantId, criterionId] = el.id.split('-');
      return {
        contestantId: parseInt(contestantId),
        criterionId:  parseInt(criterionId),
        value:        parseFloat(el.value) || 0,
      };
    });

    setLoading(true);
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
      setLoading(false);
    }
  };

  // ── updateJudge: no reload, re-hydrate only ──────────────────────
  const updateJudge = useCallback((val) => {
    setSelectedJudge(val);
    localStorage.setItem('judge_id', val);
    selectedJudgeRef.current = val;

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