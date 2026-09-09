// Module-level refs so we can clean up across calls
let activeObserver = null;
let activeChangeHandler = null;

// ── Sanitize AI HTML before caching ─────────────────────────────────
function sanitizeAiHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  const wrapper = div.firstElementChild;
  if (wrapper) {
    wrapper.style.minHeight = '';
    wrapper.style.height    = '';
    wrapper.style.position  = '';
    wrapper.style.overflow  = '';
  }
  return div.innerHTML;
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
        options += `<option value="${i}">${i}</option>`;
      }
      select.innerHTML = options;

      const dbVal    = dbLookup[select.id];
      const localVal = localStorage.getItem(`${scoreKeyPrefix}${select.id}`);

      if (dbVal !== undefined && dbVal !== null) {
        select.value = String(dbVal);
      } else if (localVal) {
        select.value = localVal;
      }
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
    recalculateRow(conId);
    updateRankings();
  };

  document.addEventListener('change', handleChange);
  activeChangeHandler = handleChange;
};

export { sanitizeAiHtml };