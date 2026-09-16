import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useConnectivity } from './useConnectivity';
import { useJudgePersistence } from './useJudgePersistence';
import { useConfigChange } from '../context/ConfigChangeContext';
import { getHydra_and_Calcu } from './getHydration_and_Calculation';
import { getSchoolId, getJudgeToken } from '../utils/judge';
import { rankValues, formatRank } from '../utils/ranks';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

import { sanitizeAiHtml } from './getHydration_and_Calculation';

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
        ai_provider: c.settings?.ai_provider || 'unorouter',
        ai_model:    c.settings?.ai_model    || 'codestral-latest',
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

// `judgePost` accepts a timeout plus an optional abort flag. When
// `cancelledRef.current` is already true the request aborts immediately; the
// caller is expected to check the ref on its own poll interval afterwards.
async function judgePost(path, body, timeoutMs, cancelledRef) {
  const controller = new AbortController();
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;

  const onExternalCancel = () => controller.abort();
  if (cancelledRef?.current) {
    onExternalCancel();
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...judgeAuthHeader() },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    });
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
    const res  = await fetch(`${API_BASE}${path}`, {
      headers: judgeAuthHeader(),
      signal:  controller.signal,
    });
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

// Deterministic, dependency-free judge table. Guaranteed to render with
// dropdowns capped to each criterion's percentage (a 25% criterion offers
// only 0-25) so scoring never blocks on AI. Carries its OWN inline CSS so the
// layout is fixed (no wrapping, aligned numbers, clean dropdowns) regardless
// of what Tailwind utilities are/aren't available.
function buildStaticJudgeTable(contestants, criteria) {
  if (!Array.isArray(contestants) || !Array.isArray(criteria)) return '';
  if (!contestants.length || !criteria.length) return '';

  const maxBy = {};
  criteria.forEach(c => {
    if (c && c.id !== undefined && c.id !== null) maxBy[String(c.id)] = Number(c.percentage) || 0;
  });

  const head = criteria.map(c =>
    `<th class="sts-th">${String(c.name || '')} <span class="sts-pct">${Number(c.percentage) || 0}%</span></th>`
  ).join('');

  const optionString = (max) => {
    let out = '<option value="">-</option>';
    for (let i = 0; i <= max; i++) out += `<option value="${i}">${i}</option>`;
    return out;
  };

  const rows = contestants.map(c => {
    const cells = criteria.map(cr => {
      const max = maxBy[String(cr.id)] ?? 100;
      return `<td class="sts-td-stc"><div class="sts-wrap"><select class="score-dropdown" id="score-${c.id}-${cr.id}">${optionString(max)}</select></div></td>`;
    }).join('');
    return `<tr class="sts-tr">` +
      `<td class="sts-td-num">${Number(c.entry_number) || ''}</td>` +
      `<td class="sts-td-name">${String(c.name || '')}</td>` +
      cells +
      `<td class="sts-td-tot" id="total-${c.id}">0.00</td>` +
      `<td class="sts-td-rank" id="rank-${c.id}">-</td>` +
      `</tr>`;
  }).join('');

  const css = `
    .sts-table{width:100%;border-collapse:separate;border-spacing:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;font-size:13px;background:#fff;table-layout:fixed}
    .sts-table thead th.sts-th{background:repeating-linear-gradient(45deg,#f8fafc,#f8fafc 6px,#f4f6f9 6px,#f4f6f9 12px);border-bottom:2px solid #cbd5d9;padding:9px 8px;text-align:center;font-weight:600;font-size:12px;letter-spacing:.02em;color:#334155}
    .sts-table .sts-pct{display:inline-block;margin-left:3px;padding:1px 5px;border-radius:6px;background:#e2e8f0;color:#475569;font-size:10px;font-weight:700}
    .sts-table td{padding:1px 8px;vertical-align:middle;border-bottom:1px solid #eef1f4;text-align:center}
    .sts-table tr:hover td{background:#fafcfd}
    .sts-td-num{width:44px;font-weight:700;color:#334155}
    .sts-td-name{width:170px;text-align:left;font-weight:600;color:#1e293b;padding-left:10px}
    .sts-td-stc{width:96px}
    .sts-td-tot{width:82px;font-weight:700;color:#0f766e}
    .sts-td-rank{width:60px;font-weight:700;color:#155e75}
    .sts-table .sts-wrap{display:flex;align-items:center;justify-content:center;padding:4px 0}
    .sts-table select.score-dropdown{width:74px;height:30px;background:#fff url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2364748b'/%3E%3C/svg%3E") no-repeat right 8px center;border:1px solid #c4ccd3;border-radius:8px;padding:0 10px;font-size:13px;color:#0f172a;text-align:center;font-weight:600;appearance:none;-webkit-appearance:none;cursor:pointer;transition:border-color .15s,box-shadow .15s}
    .sts-table select.score-dropdown:focus{outline:none;border-color:#0f766e;box-shadow:0 0 0 3px rgba(15,118,110,.12)}
    .sts-table select.score-dropdown option{font-weight:400;color:#0f172a}
    .sts-table tr:hover select.score-dropdown{border-color:#94a3b8}
  `;

  return `<style>${css}</style><div class="overflow-x-auto"><table class="sts-table">` +
    `<thead><tr>` +
    `<th style="width:44px" class="sts-th">No.</th>` +
    `<th style="width:170px;text-align:left" class="sts-th">Name</th>` +
    head +
    `<th style="width:82px" class="sts-th">Total</th>` +
    `<th style="width:60px" class="sts-th">Rank</th>` +
    `</tr></thead><tbody>${rows}</tbody></table></div>`;
}

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
  // True while the admin-generated design isn't in ui_cache yet — the judge
  // shows a "being generated" placeholder and keeps polling until it is.
  const [uiPending,     setUiPending]     = useState(false);

  const isOnline = useConnectivity();
  const { saveToCache, loadCache } = useJudgePersistence(selectedJudge, config.contestants, schoolId);

  const { changeCount: configChangeCount } = useConfigChange();

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

  const configRef     = useRef(config);
  configRef.current   = config;

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
  }, [dynamicUI, config, saveToCache, recalculateRow, updateRankings, loadCache, schoolId]);

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
  // Two triggers:
  //   1. The cross-tab signal (BroadcastChannel/localStorage) → instant refresh.
  //   2. A light poll (every 5s) so a judge open on a DIFFERENT device/tab
  //      still catches ui_mode / prompt / model / lineup changes without a
  //      reload — previously the judge refreshed only on the cross-tab signal,
  //      so an admin save from another computer never reached it.
  // When a render-relevant change is detected the loading overlay is shown and
  // the render guard is cleared so STEP 2 actually regenerates the UI.
  const configSyncBusyRef = useRef(false);
  const uiRendered   = useRef('');
  const dynamicUIRef = useRef('');
  useEffect(() => {
    dynamicUIRef.current = typeof dynamicUI === 'string' ? dynamicUI : (dynamicUI?.html || '');
  }, [dynamicUI]);

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

  const withTimeout = (promise, ms = 12000) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out — showing the standard table.')), ms)
      ),
    ]);

  // ── STEP 2: Render the judge UI — default mode builds instantly, AI mode
  //            only waits for the design the admin already generated ─────────
  const renderSignature = useMemo(() => {
    const { criteria, settings } = config;
    const criteriaSignature = (criteria || [])
      .map(c => `${c.id}:${c.percentage}`)
      .join(',');
    const aiPrompt  = settings?.ai_prompt  || '';
    const aiProvider = settings?.ai_provider || 'unorouter';
    const aiModel   = settings?.ai_model   || 'codestral-latest';
    const uiMode    = settings?.ui_mode    || 'ai';
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
    // the client, never touches the AI pipeline, never shows a placeholder.
    if (uiMode === 'default') {
      const staticTable = buildStaticJudgeTable(contestants, criteria);
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
    // only polls until the cache is ready. If a table is already on screen,
    // keep it under the "Updating interface…" overlay; otherwise the judge
    // shows the "UI being generated" placeholder until it lands.
    const hasPrevious = !!dynamicUIRef.current;
    setLoading(false);
    setUiRefreshing(hasPrevious);
    setUiPending(!hasPrevious);
  }, [config, renderSignature]);

  // Poll the admin-generated ui_cache until a design matching our
  // prompt/model/criteria signature is available. Pure consumer — on an empty
  // cache the placeholder stays up and this keeps retrying every few seconds.
  useEffect(() => {
    const { contestants, criteria, settings } = configRef.current;
    if (!contestants?.length || !criteria?.length) return;
    const uiMode = settings?.ui_mode || 'ai';
    if (uiMode !== 'ai') return;

    const school_id = getSchoolId();
    const criteriaSignature = criteria
      .map(c => `${c.id}:${c.percentage}`)
      .join(',');
    const aiPrompt  = settings?.ai_prompt  || '';
    const aiProvider = settings?.ai_provider || 'unorouter';
    const aiModel   = settings?.ai_model   || 'codestral-latest';
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
          const html = sanitizeAiHtml(cached.html, criteria);
          setDynamicUI(prev => (prev?.html === html ? prev : { html }));
          setUiPending(false);
          setUiRefreshing(false);
          console.log(`🎨 [judge-poll] cached AI UI ready school=${school_id} len=${html.length}`);
          return; // design received — stop polling
        }
        setUiPending(true);
        console.log(`⏳ [judge-poll] ui_cache still generating school=${school_id} — retrying…`);
        timer = setTimeout(poll, 4000);
      } catch (err) {
        if (cancelled) return;
        console.warn(`⏳ [judge-poll] fetch error (${err.message}) — retrying school=${school_id}`);
        setUiPending(true);
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
  }, [dynamicUI, config, saveToCache, recalculateRow, updateRankings, schoolId]);

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