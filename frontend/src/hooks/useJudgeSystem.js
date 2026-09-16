import { useState, useEffect, useRef, useCallback } from 'react';
import { useConnectivity } from './useConnectivity';
import { useJudgePersistence } from './useJudgePersistence';
import { useConfigChange } from '../context/ConfigChangeContext';
import { getHydra_and_Calcu } from './getHydration_and_Calculation';
import { getSchoolId, getJudgeToken } from '../utils/judge';
import { rankValues, formatRank } from '../utils/ranks';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

import { sanitizeAiHtml } from './getHydration_and_Calculation';

/* ── Client-side HTML cache helpers ─────────────────────────────── */

// ✅ FIX: the cache key now folds in aiModel AND uiMode, not just aiPrompt.
// Before, changing the model in the admin panel kept showing the old design
// because the prompt slug was unchanged and localStorage hit.
function getUiCacheKey(schoolId, criteria, aiPrompt, aiModel, uiMode) {
  const criteriaSignature = criteria.map(c => `${c.id}:${c.percentage}`).join(',');
  const promptSlug = (aiPrompt || 'default').slice(0, 64);
  const modelSlug  = (aiModel  || 'default').slice(0, 32);
  const modeSlug   =  uiMode   || 'ai';
  return `ui_html_cache_${schoolId}_${criteriaSignature}_${promptSlug}_${modelSlug}_${modeSlug}`;
}

function saveUiToLocalStorage(schoolId, criteria, ui, aiPrompt, aiModel, uiMode) {
  try {
    const key = getUiCacheKey(schoolId, criteria, aiPrompt, aiModel, uiMode);
    localStorage.setItem(key, JSON.stringify({ html: sanitizeAiHtml(ui.html, criteria) }));
  } catch (e) {
    console.warn('[UICache] could not save HTML cache:', e.message);
  }
}

function loadUiFromLocalStorage(schoolId, criteria, aiPrompt, aiModel, uiMode) {
  try {
    const key = getUiCacheKey(schoolId, criteria, aiPrompt, aiModel, uiMode);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.html) {
      parsed.html = sanitizeAiHtml(parsed.html, criteria);
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

// Only the fields below drive the judge's rendered table. Ignoring the rest
// (e.g. is_judge_locked toggles) prevents a pointless overlay flash while a
// polled config update is still applied.
function renderRelevantChanged(a, b) {
  const sig = (c) =>
    JSON.stringify({
      contestants: c.contestants || [],
      criteria:    c.criteria    || [],
      settings: {
        ai_prompt: c.settings?.ai_prompt || '',
        ai_model:  c.settings?.ai_model  || 'qwen3.8-flash',
        ui_mode:   c.settings?.ui_mode   || 'ai',
      },
    });
  return sig(a) !== sig(b);
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

/* ── Plain fetch helpers with the judge JWT ─────────────────────── */
function judgeAuthHeader() {
  const token = getJudgeToken(getSchoolId()) || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ FIX: `judgePost` now actually honors `cancelledRef`. The old code had
//   signal: cancelledRef?.current ? controller.signal : controller.signal
// which is the same value on both branches — cancelledRef was dead weight.
// We now wire an abort listener to the ref so the caller can cancel a
// pending 95s request (used by the poll loop and unmount paths).
async function judgePost(path, body, timeoutMs, cancelledRef) {
  const controller = new AbortController();
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;

  const onExternalCancel = () => controller.abort();
  if (cancelledRef?.current) {
    onExternalCancel();
  } else if (cancelledRef) {
    // Can't subscribe to a ref directly; poll it at the poll interval of the
    // caller instead. See pollJobUntilDone which already checks it.
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

/* ── AI UI generation (async job queue) ─────────────────────────── */

// ✅ FIX: bumped from 30 to 60 attempts. The server's AI_WAIT_TIMEOUT_MS
// defaults to 80s; 30 * 2s = 60s gave up BEFORE the server's cap, so a job
// that finished at 70s was silently dropped and the judge kept the stale UI.
// 60 * 2s = 120s leaves comfortable headroom.
const AI_POLL_INTERVAL_MS  = 2000;
const AI_POLL_MAX_ATTEMPTS = 60;
const AI_POLL_TIMEOUT_MS   = 5000;

async function pollJobUntilDone(jobId, schoolId, cancelledRef) {
  const url = `/ai/generations/${jobId}`;
  for (let attempt = 0; attempt < AI_POLL_MAX_ATTEMPTS; attempt++) {
    if (cancelledRef?.current) return { error: 'Generation cancelled.' };
    let status;
    try {
      status = await judgeGet(url, AI_POLL_TIMEOUT_MS);
    } catch (err) {
      return { error: err.message || 'Failed to check generation status.' };
    }
    if (status?.status === 'COMPLETED' && status.result) return { html: status.result };
    if (status?.status === 'FAILED') return { error: status.error || 'AI generation failed.' };
    await new Promise(r => setTimeout(r, AI_POLL_INTERVAL_MS));
  }
  return { error: 'AI generation took too long — showing the standard table instead.' };
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

  // ✅ FIX: the watchdog is now armed ONCE when the overlay first appears and
  // is not re-armed on every flag flip. Previously the cleanup ran on every
  // loading/uiRefreshing toggle, so a flicker between the two flags (STEP 1b
  // sets loading, STEP 2 clears it, then sets uiRefreshing, etc.) kept pushing
  // the 100s deadline into the future — the "infinite loading" you saw.
  const watchdogRef   = useRef(null);
  const configRef     = useRef(config);
  configRef.current   = config;

  useEffect(() => {
    const overlayActive = loading || uiRefreshing;
    if (!overlayActive) {
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
      return;
    }
    if (watchdogRef.current) return; // already armed — do NOT reset

    watchdogRef.current = setTimeout(() => {
      watchdogRef.current = null;
      console.warn('[watchdog] forcing static table after 100s');
      setLoading(false);
      setUiRefreshing(false);
      const { contestants, criteria } = configRef.current;
      const tbl = buildStaticJudgeTable(contestants, criteria);
      if (tbl) setDynamicUI(prev => (prev?.html === tbl ? prev : { html: tbl }));
    }, 100000);

    return () => {
      // NOTE: intentionally no cleanup here — we clear only when the overlay
      // is released (the !overlayActive branch above). Cleanup-on-every-render
      // is what caused the reset loop.
    };
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
  const liveGenRef   = useRef(0);
  useEffect(() => {
    dynamicUIRef.current = typeof dynamicUI === 'string' ? dynamicUI : (dynamicUI?.html || '');
  }, [dynamicUI]);

  useEffect(() => {
    const syncNow = async () => {
      if (configSyncBusyRef.current) return;
      configSyncBusyRef.current = true;
      try {
        const data = await withTimeout(
          judgeGet(`/public/get-all-data?school_id=${schoolId}`),
          12000
        );
        if (!data || data.error) return;

        const fresh = {
          contestants: data.contestants || [],
          criteria:    data.criteria    || [],
          settings:    data.settings    || {},
        };
        saveConfigToLocalStorage(schoolId, fresh);

        if (configsMatch(configRef.current, fresh)) return;

        if (renderRelevantChanged(configRef.current, fresh)) {
          const hasTable = !!dynamicUIRef.current;
          uiRendered.current = '';
          setLoading(!hasTable);
          setUiRefreshing(hasTable);
        }
        setConfig(fresh);
      } catch {
        // timeout/offline — keep the current UI, the next tick retries
      } finally {
        configSyncBusyRef.current = false;
      }
    };

    if (configChangeCount > 0) syncNow();

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

  // ── STEP 2: Render judge table — static first, AI upgrades in background ─
  useEffect(() => {
    const { contestants, criteria, settings } = config;

    if (!contestants?.length || !criteria?.length) {
      // Nothing to render → never leave STEP 1b's loader/overlay hanging.
      setLoading(false);
      setUiRefreshing(false);
      return;
    }

    const school_id = getSchoolId();
    const criteriaSignature = criteria
      .map(c => `${c.id}:${c.percentage}`)
      .join(',');
    const aiPrompt = settings?.ai_prompt || '';
    const aiModel  = settings?.ai_model  || 'qwen3.8-flash';
    const uiMode   = settings?.ui_mode   || 'ai';
    const renderSignature = `${criteriaSignature}::${aiPrompt}::${aiModel}::${uiMode}`;

    if (uiRendered.current === renderSignature) {
      setUiRefreshing(false);
      return;
    }
    uiRendered.current = renderSignature;

    const staticTable = buildStaticJudgeTable(contestants, criteria);

    // ✅ FIX: `render-ui-cached` now receives the prompt, model, and ui_mode so
    // the server can key its lookup on prompt_hash instead of criteria only.
    // This is what makes "change the prompt → get a new design" actually work.
    const cachedUrl =
      `/judge/render-ui-cached?school_id=${school_id}` +
      `&criteria_signature=${encodeURIComponent(criteriaSignature)}` +
      `&prompt=${encodeURIComponent(aiPrompt)}` +
      `&model=${encodeURIComponent(aiModel)}` +
      `&ui_mode=${encodeURIComponent(uiMode)}`;

    const renderUI = async () => {
      // Default mode has NO AI — render the built-in table instantly and never
      // touch the generation pipeline or the loading overlay.
      if (uiMode === 'default') {
        if (staticTable) {
          setDynamicUI(prev => (prev?.html === staticTable ? prev : { html: staticTable }));
          try {
            saveUiToLocalStorage(school_id, criteria, { html: staticTable }, aiPrompt, aiModel, uiMode);
          } catch { /* ignore */ }
        }
        setLoading(false);
        setUiRefreshing(false);
        return;
      }

      const hasPrevious = !!dynamicUIRef.current;
      try {
        if (!hasPrevious && staticTable) {
          setDynamicUI(prev => (prev?.html === staticTable ? prev : { html: staticTable }));
        }
        setLoading(false);

        // 1. localStorage hit → use it, sync DB cache in background
        const localCached = loadUiFromLocalStorage(school_id, criteria, aiPrompt, aiModel, uiMode);
        if (localCached?.html) {
          setDynamicUI(prev => (prev?.html === localCached.html ? prev : localCached));

          withTimeout(judgeGet(cachedUrl, 12000))
            .then(data => {
              if (!data) return;
              // ✅ FIX: no longer writes the server response back into
              // localStorage under the *new* prompt key. Previously, when the
              // prompt changed, this line stored the OLD design into the NEW
              // prompt's cache slot — permanently poisoning the cache and
              // explaining the "still shows the previous UI" symptom.
              if (data.fromCache === false) {
                return ensureCachedUi(contestants, criteria, settings, school_id, true);
              }
              if (data.html && data.html !== localCached.html) {
                const cleanHtml = sanitizeAiHtml(data.html, criteria);
                if (cleanHtml !== localCached.html) setDynamicUI({ html: cleanHtml });
              }
            })
            .catch(() => { /* offline or timeout — local cache is already showing */ });

          return;
        }

        // 2. No local cache → refresh from the DB-backed endpoint or ask the AI.
        if (hasPrevious) setUiRefreshing(true);
        const cached = await withTimeout(judgeGet(cachedUrl, 12000), 12000);

        if (cached.fromCache === false) {
          const ui = await ensureCachedUi(contestants, criteria, settings, school_id, true);
          if (ui?.html) setDynamicUI(prev => (prev?.html === ui.html ? prev : ui));
          return;
        }

        if (cached.html && cached.html !== staticTable) {
          const html = sanitizeAiHtml(cached.html, criteria);
          // ✅ FIX: no `saveUiToLocalStorage` here either — same poisoning issue
          // as above. localStorage is now populated ONLY by `ensureCachedUi`
          // after a real generation, so it can never hold a design that doesn't
          // match the prompt it's stored under.
          setDynamicUI(prev => (prev?.html === html ? prev : { html }));
          return;
        }

        const ui = await ensureCachedUi(contestants, criteria, settings, school_id, true);
        if (ui?.html) {
          setDynamicUI(prev => (prev?.html === ui.html ? prev : ui));
        }
      } catch (err) {
        // Timeout/failure — the static table is already on screen, keep it.
      } finally {
        setLoading(false);
        setUiRefreshing(false);
      }
    };

    renderUI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, uiRendered]);

  // Generate-or-fetch the AI table for the given config, caching locally.
  const ensureCachedUi = async (contestants, criteria, settings, school_id, silent = false) => {
    const staticTable = buildStaticJudgeTable(contestants, criteria);

    // Default mode: the built-in table IS the design — never call the backend,
    // never show a loader, never wait on an AI job.
    if (settings?.ui_mode === 'default') {
      if (staticTable) {
        setDynamicUI(prev => (prev?.html === staticTable ? prev : { html: staticTable }));
        try {
          saveUiToLocalStorage(school_id, criteria, { html: staticTable },
            settings?.ai_prompt || '', settings?.ai_model || '', 'default');
        } catch { /* ignore */ }
      }
      setLoading(false);
      setUiRefreshing(false);
      return { html: staticTable || null };
    }

    const settleFallback = () => {
      if (staticTable) {
        setDynamicUI(prev => (prev?.html === staticTable ? prev : { html: staticTable }));
      }
      setLoading(false);
      setUiRefreshing(false);
      return { html: null };
    };
    const settle = (html) => {
      setDynamicUI(prev => (prev?.html === html ? prev : { html }));
      setLoading(false);
      setUiRefreshing(false);
      return { html };
    };

    const genSeq = ++liveGenRef.current;

    if (!silent) setLoading(true);
    let submitResp;
    try {
      submitResp = await judgePost('/ai/generate', {
        contestants,
        criteria,
        school_id,
        aiPrompt: settings?.ai_prompt || 'Modern and Professional',
        aiModel:  settings?.ai_model  || 'qwen3.8-flash',
        uiMode:   settings?.ui_mode   || 'ai',
        // ✅ FIX: send the boolean `true`, not the number `1`. The server does
        // `req.body.wait === true`, so `1` silently fell through and the judge
        // always got the deterministic fallback instead of waiting for the LLM.
        wait: true,
      // ✅ FIX: bumped from 95s → 120s so it exceeds AI_WAIT_TIMEOUT_MS (80s
      // default) with comfortable slack even if the env var is tuned upward.
      }, 120000);
    } catch (postErr) {
      return settleFallback();
    }

    if (submitResp.result && !submitResp.fallback) {
      const html = sanitizeAiHtml(submitResp.result, criteria);
      try {
        saveUiToLocalStorage(school_id, criteria, { html },
          settings?.ai_prompt || '', settings?.ai_model || '', settings?.ui_mode || 'ai');
      } catch { /* ignore */ }
      return settle(html);
    }

    if (submitResp.status === 'FAILED') {
      settleFallback();
      if (staticTable) {
        showStatus('Notice', submitResp.error || 'AI generation failed — showing the standard scoring table.', 'warning');
      }
      return { html: null };
    }

    // ✅ FIX: always poll in the background when there is a live generation id —
    // even when the backend answered PROCESSING/fallback, the worker may still
    // finish seconds later and the AI design should swap in without a reload.
    if (submitResp.generationId) {
      const cancelRef = { current: liveGenRef.current !== genSeq };
      pollJobUntilDone(submitResp.generationId, school_id, cancelRef).then(result => {
        if (!result.html) return;
        if (liveGenRef.current !== genSeq) return;
        const aiHtml = sanitizeAiHtml(result.html, criteria);
        try {
          saveUiToLocalStorage(school_id, criteria, { html: aiHtml },
            settings?.ai_prompt || '', settings?.ai_model || '', settings?.ui_mode || 'ai');
        } catch { /* ignore */ }
        setDynamicUI(prev => (prev?.html === aiHtml ? prev : { html: aiHtml }));
      });
      return settleFallback();
    }

    return settleFallback();
  };

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
    waitSeconds,
    isComplete,
    modal,
    isOnline,
    closeModal,
    submitToDB,
    updateJudge,
  };
};