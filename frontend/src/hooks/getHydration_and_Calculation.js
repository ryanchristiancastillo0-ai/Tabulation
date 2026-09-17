// Module-level refs so we can clean up across calls
let activeObserver = null;
let activeChangeHandler = null;

// ── Sanitize AI HTML before caching / before render ─────────────────
// Also force-cleans every .score-dropdown so AI templating garbage
// (${i40}, {cId}, …) can never leak into the rendered options even when
// the table is remounted (e.g. the submit loader toggles loading).
function sanitizeAiHtml(html, criteria) {
  const div = document.createElement('div');
  div.innerHTML = html;
  stripDuplicateSelects(div);
  const wrapper = div.firstElementChild;
  if (wrapper) {
    wrapper.style.minHeight = '';
    wrapper.style.height    = '';
    wrapper.style.position  = '';
    wrapper.style.overflow  = '';
  }

  const maxByCriterion = {};
  if (Array.isArray(criteria)) {
    criteria.forEach(c => {
      if (c.id !== undefined && c.id !== null) maxByCriterion[String(c.id)] = Number(c.percentage) || 0;
    });
  }

  div.querySelectorAll('select.score-dropdown').forEach(select => {
    const parts = (select.id || '').split('-');
    const critId = parts[2];
    const max = critId && maxByCriterion[critId] !== undefined ? maxByCriterion[critId] : 100;
    let options = '<option value="">-</option>';
    for (let i = max; i >= 0; i--) {
      options += `<option value="${i}">${i}%</option>`;
    }
    select.innerHTML = options;

    // Force every score cell to EXACTLY ONE control. The wrap must contain only
    // this visible native <select> — anything else (leftover custom <details>
    // trigger from stale cached designs, "%" labels, duplicated selects, extra
    // triggers) is removed so old cached designs can't render a second control
    // beside the box.
    const wrap = select.closest('.sts-dd-wrap');
    if (wrap) {
      Array.prototype.slice.call(wrap.children).forEach(child => {
        if (child === select) return;
        child.remove();
      });
    }
  });

  return div.innerHTML;
}

// ── One-dropdown-per-cell rule ───────────────────────────────────────
// Every scoring cell must contain EXACTLY ONE dropdown control. A cell is a
// scoring cell if it contains a .score-dropdown; the canonical score select is
// the one whose id is score-<digits>-<digits>. Any other select in that cell —
// an AI "percentage" box also tagged .score-dropdown, a stray native box —
// and any duplicate custom box (an extra .sts-dd-wrap / <details> trigger)
// is removed outright, so each criterion renders one dropdown only.
function stripDuplicateSelects(root) {
  const cells = new Map(); // scoring cell (td/th) -> canonical select to keep
  root.querySelectorAll('select.score-dropdown').forEach(select => {
    const cell = select.closest('td, th');
    if (!cell) return;
    if (!cells.has(cell)) {
      cells.set(cell, select);
    } else {
      const keep       = cells.get(cell);
      const keepIsReal = /^score-\d+-\d+$/.test(keep.id || '');
      const selIsReal  = /^score-\d+-\d+$/.test(select.id || '');
      if (!keepIsReal && selIsReal) {
        cells.set(cell, select);
        keep.remove();
      } else {
        select.remove();
      }
    }
  });

  cells.forEach((keep, cell) => {
    // 1) Drop every other <select> in the cell (native or .score-dropdown).
    cell.querySelectorAll('select').forEach(extra => {
      if (extra !== keep) extra.remove();
    });

    // 2) Duplicate custom dropdown wraps (the "21% ▼" box).
    const keepWrap = keep.closest('.sts-dd-wrap');
    cell.querySelectorAll('.sts-dd-wrap').forEach(el => {
      if (el !== keepWrap) el.remove();
    });

    // 3) Loose custom dropdown <details> not inside the kept wrap.
    cell.querySelectorAll('details.sts-dd').forEach(el => {
      if (keepWrap && keepWrap.contains(el)) return;
      el.remove();
    });
  });
}
// Keeps the trigger's placeholder label ("–") in sync with the native select.
// The select itself already shows the chosen option; this only re-applies the
// "–" placeholder when the value is cleared.
function syncRichDisplay(select, dbVal) {
  const v = dbVal !== undefined && dbVal !== null ? String(dbVal) : select.value;
  if (v === '' || v === null || v === undefined) select.value = '';
}

export const getHydra_and_Calcu = (
  dynamicUI,
  config,
  saveToCache,
  recalculateRow,
  updateRankings,
  selectedJudge,
  dbScores = [],
  schoolId
) => {
  if (!dynamicUI) return;

  const scoreKeyPrefix = schoolId
    ? `j${schoolId}_judge_${selectedJudge}_`
    : `judge_${selectedJudge}_`;

  // ── Tear down any previous observer + listener before starting fresh ──
  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }
  if (activeChangeHandler) {
    document.removeEventListener('change', activeChangeHandler);
    activeChangeHandler = null;
  }

  const applyData = () => {
    stripDuplicateSelects(document);
    const dropdowns = document.querySelectorAll('.score-dropdown');
    if (dropdowns.length === 0) return false;

    const dbLookup = {};
    if (Array.isArray(dbScores)) {
      dbScores.forEach(s => {
        dbLookup[`score-${s.contestant_id}-${s.criterion_id}`] = s.score_value;
      });
    }

    // Map criterion id -> max weight so each dropdown caps at its own max
    const maxByCriterion = {};
    if (Array.isArray(config.criteria)) {
      config.criteria.forEach(c => {
        if (c.id !== undefined && c.id !== null) maxByCriterion[String(c.id)] = Number(c.percentage) || 0;
      });
    }

    dropdowns.forEach(select => {
      // Force every score cell to EXACTLY ONE control (see sanitizeAiHtml).
      const wrap = select.closest('.sts-dd-wrap');
      if (wrap) {
        Array.prototype.slice.call(wrap.children).forEach(child => {
          if (child === select) return;
          child.remove();
        });
      }
      // Sanitize the dropdown's parent wrapper to strip rogue AI styles
      const wrapper = select.closest('div, td, th');
      if (wrapper) {
        wrapper.style.minHeight = '';
        wrapper.style.height    = '';
        wrapper.style.position  = '';
        wrapper.style.overflow  = '';
      }

      // Cap options to the criterion's max weight (its percentage), e.g. 0–25 for a 25% criterion
      const parts = select.id.split('-');
      const max   = parts[2] !== undefined && maxByCriterion[parts[2]] !== undefined
        ? maxByCriterion[parts[2]]
        : 100;
      let options = '<option value="">-</option>';
      for (let i = max; i >= 0; i--) {
        options += `<option value="${i}">${i}%</option>`;
      }
      select.innerHTML = options;

      const dbVal    = dbLookup[select.id];
      const localVal = localStorage.getItem(`${scoreKeyPrefix}${select.id}`);

      // Only restore a real numeric score that still exists in the rebuilt
      // options — stale AI-templated values (e.g. "${i40}") must not stick.
      const inRange = (v) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= 0 && n <= max && String(n) in select.options;
      };

      if (dbVal !== undefined && dbVal !== null && inRange(dbVal)) {
        select.value = String(dbVal);
      } else if (localVal && inRange(localVal)) {
        select.value = localVal;
      } else {
        select.value = '';
      }
      syncRichDisplay(select);
    });

    // Sanitize the top-level AI wrapper too
    const aiRoot = document.querySelector('.ai-rendered-content > div');
    if (aiRoot) {
      aiRoot.style.minHeight = '';
      aiRoot.style.height    = '';
      aiRoot.style.position  = '';
      aiRoot.style.overflow  = '';
    }

    if (config.contestants) {
      config.contestants.forEach(c => recalculateRow(c.id));
      updateRankings();
    }

    return true;
  };

  // Only set up observer if the table isn't rendered yet
  if (!applyData()) {
    const observer = new MutationObserver((mutations, obs) => {
      if (applyData()) {
        obs.disconnect();
        if (activeObserver === observer) {
          activeObserver = null;
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    activeObserver = observer;
  }

  // Attach change listener for real-time localStorage backup
  const handleChange = (e) => {
    if (!e.target.classList.contains('score-dropdown')) return;
    const conId = e.target.id.split('-')[1];
    localStorage.setItem(`${scoreKeyPrefix}${e.target.id}`, e.target.value);
    if (saveToCache) saveToCache(e.target.id, e.target.value);
    syncRichDisplay(e.target);
    recalculateRow(conId);
    updateRankings();
  };

  document.addEventListener('change', handleChange);
  activeChangeHandler = handleChange;
};

export { sanitizeAiHtml };