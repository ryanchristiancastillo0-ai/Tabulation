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
    // the <details> dropdown and this hidden select — anything else (stale
    // "%" labels, duplicated selects, extra triggers) is removed so old cached
    // designs can't render a second control beside the box.
    const wrap = select.closest('.sts-dd-wrap');
    if (wrap) {
      Array.prototype.slice.call(wrap.children).forEach(child => {
        if (child === select || child.classList.contains('sts-dd')) return;
        child.remove();
      });
      const panel = wrap.querySelector('.sts-dd-panel');
      if (panel) {
        let opts = `<div class="sts-dd-option" data-value="" role="option">–</div>`;
        for (let i = max; i >= 0; i--) {
          const decadeClass = (i > 0 && i % 10 === 0) ? ' sts-dd-decade' : '';
          opts += `<div class="sts-dd-option${decadeClass}" data-value="${i}" role="option">${i}%</div>`;
        }
        panel.innerHTML = opts;
      }
    }
  });

  return div.innerHTML;
}

// ── One-dropdown-per-cell rule ───────────────────────────────────────
// Any <select> sharing a cell with a .score-dropdown that ISN'T the score
// select is a stray/duplicate dropdown (AIs love emitting a "percentage"
// select next to each score). Replace it with plain static text so every
// criterion cell has exactly one control. The main .score-dropdown is left
// untouched, and the displayed value is preserved as text.
function stripDuplicateSelects(root) {
  root.querySelectorAll('.score-dropdown').forEach(keep => {
    const cell = keep.closest('td, th');
    if (!cell) return;
    cell.querySelectorAll('select').forEach(extra => {
      if (extra === keep || extra.classList.contains('score-dropdown')) return;
      const opt  = extra.selectedOptions && extra.selectedOptions[0];
      const text = (opt ? opt.textContent : '').trim();
      const span = document.createElement('span');
      span.textContent = text === '' ? '–' : text;
      span.style.display  = 'inline-block';
      span.style.fontWeight = '600';
      span.style.padding   = '0 4px';
      span.style.color     = 'inherit';
      extra.replaceWith(span);
    });
  });
}

// Keeps the dropdown's trigger label in sync with the selected score (plain
// text number; "–" when nothing selected) so restored/saved scores are shown.
function syncRichDisplay(select, dbVal) {
  const wrap = select.closest('.sts-dd-wrap');
  if (!wrap) return;
  const v = dbVal !== undefined && dbVal !== null ? String(dbVal) : select.value;
  const hasValue = v !== '' && v !== null && v !== undefined;
  const val = wrap.querySelector('.sts-dd-value');
  if (val) val.textContent = hasValue ? v.replace('%', '') : '–';
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
          if (child === select || child.classList.contains('sts-dd')) return;
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