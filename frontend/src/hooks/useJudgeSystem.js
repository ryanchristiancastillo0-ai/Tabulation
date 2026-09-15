import { useState, useEffect, useRef, useCallback } from 'react';
import { useConnectivity } from './useConnectivity';
import { useJudgePersistence } from './useJudgePersistence';
import { useConfigChange } from '../context/ConfigChangeContext';
import { getHydra_and_Calcu } from './getHydration_and_Calculation';
import {getSchoolId, getJudgeToken} from '../utils/judge'
import { rankValues, formatRank } from '../utils/ranks'
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
    localStorage.setItem(key, JSON.stringify({ html: sanitizeAiHtml(ui.html, criteria) }));
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
// The judge/AI endpoints are protected by requireJudge: the school comes from
// the token, so these calls MUST carry the judge's Bearer token. The /public/*
// endpoints ignore it, so sending it on every judge call is harmless.
function judgeAuthHeader() {
  const token = getJudgeToken(getSchoolId()) || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function judgePost(path, body, timeoutMs, cancelledRef) {
  const controller = new AbortController();
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...judgeAuthHeader() },
      body:    JSON.stringify(body),
      signal:  cancelledRef?.current ? controller.signal : controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    if (timer) clearTimeout(timer);
    if (timer && controller.signal.aborted) throw new Error('Request timed out — showing the standard table.');
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function judgeGet(path, timeoutMs) {
  const controller = new AbortController();
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res  = await fetch(`${API_BASE}${path}`, { headers: judgeAuthHeader(), signal: controller.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    if (timer && controller.signal.aborted) throw new Error('Request timed out — showing the standard table.');
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/* ── AI UI generation (async job queue) ─────────────────────────── */
const AI_POLL_INTERVAL_MS  = 2000;
const AI_POLL_MAX_ATTEMPTS = 15; // ~30s — never keep the judge blocked longer.
const AI_POLL_TIMEOUT_MS   = 5000; // each status check is bounded too

// Polls a queued AI generation job until it COMPLETES, FAILS, or gives up.
// Returns { html } on success or { error } otherwise.
async function pollJobUntilDone(jobId, schoolId, cancelledRef) {
  const url = `/ai/generations/${jobId}?school_id=${encodeURIComponent(schoolId)}`;
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
  const [isComplete,    setIsComplete]    = useState(false);
  const [modal,         setModal]         = useState({ show: false, title: '', message: '', type: 'success' });

  const isOnline = useConnectivity();
  const { saveToCache, loadCache } = useJudgePersistence(selectedJudge, config.contestants, schoolId);

  const { changeCount: configChangeCount } = useConfigChange();

  const showStatus = (title, message, type = 'success', onConfirm) =>
    setModal(onConfirm ? { show: true, title, message, type, onConfirm } : { show: true, title, message, type });

  const closeModal = () => {
    setModal(prev => ({ ...prev, show: false }));
    // Make sure submitted values stay visible after the modal is dismissed.
    setTimeout(restoreScores, 0);
  };

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
    // Rank only contestants that actually have a total — a zero total means no
    // score has been entered yet, so it stays blank (same behavior as before).
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

  // Re-apply the current judge's saved values into the table. Called after
  // every modal dismissal so that whatever re-render happened underneath
  // (e.g. the submit loader toggling) can never leave empty dropdowns.
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
        const data = await judgeGet(`/public/get-all-data?school_id=${school_id}`, 12000);

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
    withTimeout(
      judgeGet(`/public/get-all-data?school_id=${schoolId}`),
      12000
    )
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
        // Timeout/network failure — never leave the judge on a loader. STEP 2
        // will still run with the current config and render the static table.
        setLoading(false);
        setUiRefreshing(false);
      });
  }, [configChangeCount, schoolId]);

  // Fetch with a hard timeout so a slow/stuck display endpoint can NEVER keep
  // the judge on a spinner — the static table always takes over.
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

    if (!contestants?.length || !criteria?.length) return;

    const school_id = getSchoolId();
    const criteriaSignature = criteria
      .map(c => `${c.id}:${c.percentage}`)
      .join(',');
    const aiPrompt = settings?.ai_prompt || '';
    const aiModel = settings?.ai_model || 'qwen3.8-flash';
    const uiMode = settings?.ui_mode || 'ai';
    const renderSignature = `${criteriaSignature}::${aiPrompt}::${aiModel}::${uiMode}`;

    // Re-run only when the actual config signature changes (admin edits, etc.),
    // so unchanged configs don't cause redundant regenerations.
    if (uiRendered.current === renderSignature) return;
    uiRendered.current = renderSignature;

    // Static table = what the judge sees INSTANTLY on load, no network, no AI.
    // It's derived from the config itself (dropdowns 0..percentage) so the page
    // can never be stuck on "Building interface…" waiting for a generation job.
    const staticTable = buildStaticJudgeTable(contestants, criteria);

    const renderUI = async () => {
      // Show the deterministic table right away and let the AI version fill in
      // behind it. Keeps a previous good table on screen while refreshing.
      const hasPrevious = !!dynamicUIRef.current;
      if (!hasPrevious && staticTable) {
        setDynamicUI(prev => (prev?.html === staticTable ? prev : { html: staticTable }));
      }
      setLoading(false);

      // 1. localStorage hit → use it, sync DB cache in background
      const localCached = loadUiFromLocalStorage(school_id, criteria, aiPrompt);
      if (localCached?.html) {
        setDynamicUI(prev => (prev?.html === localCached.html ? prev : localCached));

        // Background refresh — hits cache-only endpoint, NEVER triggers AI here.
        // When nothing is cached the backend hands back a ready-to-use
        // standard table (dropdowns already 0..percentage), so we never need
        // to kick off an AI job just to show something.
        withTimeout(
          judgeGet(
            `/judge/render-ui-cached?school_id=${school_id}` +
            `&criteria_signature=${encodeURIComponent(criteriaSignature)}`
          ),
          12000
        )
          .then(data => {
            if (data.html && data.html !== localCached.html) {
              const cleanHtml = sanitizeAiHtml(data.html, criteria);
              saveUiToLocalStorage(school_id, criteria, { html: cleanHtml }, aiPrompt);
              if (cleanHtml !== localCached.html) setDynamicUI({ html: cleanHtml });
            }
          })
          .catch(() => {
            // Offline or timeout — local cache is already showing, nothing to do
          });

        return;
      }

      // 2. No local cache → refresh from the DB-backed endpoint (fast) or, as a
      //    last resort, ask the AI — but always with a hard timeout.
      if (hasPrevious) setUiRefreshing(true);
      try {
        const cached = await withTimeout(
          judgeGet(
            `/judge/render-ui-cached?school_id=${school_id}` +
            `&criteria_signature=${encodeURIComponent(criteriaSignature)}`
          ),
          12000
        );
        if (cached.html && cached.html !== staticTable) {
          const html = sanitizeAiHtml(cached.html, criteria);
          saveUiToLocalStorage(school_id, criteria, { html }, aiPrompt);
          setDynamicUI(prev => (prev?.html === html ? prev : { html }));
          return;
        }
        // Nothing cached yet → generate in the background (may be the AI or
        // the backend's standard fallback, both return usable HTML fast).
        const ui = await ensureCachedUi(contestants, criteria, settings, school_id, true);
        if (ui?.html) {
          saveUiToLocalStorage(school_id, criteria, ui, aiPrompt);
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
  // When `silent` is true the caller already manages the loading indication
  // (e.g. the refresh overlay), so this never flips the full-screen loader.
  // Every branch returns usable HTML — the AI result if available, otherwise a
  // deterministic standard table — so the judge is never stuck on a spinner.
  const ensureCachedUi = async (contestants, criteria, settings, school_id, silent = false) => {
    const staticTable = buildStaticJudgeTable(contestants, criteria);

    const settle = (html) => {
      setDynamicUI(prev => (prev?.html === html ? prev : { html }));
      setLoading(false);
      setUiRefreshing(false);
      return { html };
    };

    if (!silent) setLoading(true);
    try {
      let submitResp;
      try {
        submitResp = await judgePost('/ai/generate', {
          contestants,
          criteria,
          school_id,
          aiPrompt: settings?.ai_prompt || 'Modern and Professional',
          aiModel: settings?.ai_model || 'qwen3.8-flash',
          uiMode: settings?.ui_mode || 'ai',
        }, 15000); // hard cap — a stuck AI call can never freeze the judge page
      } catch (postErr) {
        // Backend unreachable / timed out — use the deterministic table immediately.
        return settle(staticTable);
      }

      // Cached fast-path returns the html directly (also the on-screen
      // fallback the backend sends when the AI queue is unavailable).
      if (submitResp.result) {
        const html = sanitizeAiHtml(submitResp.result, criteria);
        if (!submitResp.fallback) {
          try { saveUiToLocalStorage(school_id, criteria, { html }, settings?.ai_prompt || ''); } catch { /* ignore */ }
        }
        return settle(html);
      }

      // Queued path: poll until the job ends, but never block forever — on
      // timeout/error we fall back to the standard table.
      if (submitResp.generationId) {
        const result = await pollJobUntilDone(submitResp.generationId, school_id);
        if (result.html) {
          const html = sanitizeAiHtml(result.html, criteria);
          try { saveUiToLocalStorage(school_id, criteria, { html }, settings?.ai_prompt || ''); } catch { /* ignore */ }
          return settle(html);
        }
        if (staticTable) {
          showStatus('Notice', result.error || 'Showing the standard scoring table.', 'warning');
        }
        return settle(staticTable);
      }

      // No html and no job (shouldn't happen) — show the standard table.
      return settle(staticTable);
    } catch (err) {
      return settle(staticTable || '');
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
        // Immediately re-apply the judge's saved values after a successful
        // submit, so the submitted scores stay visible in the dropdowns even
        // if the table re-renders / remounts (submit toggles the loader).
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