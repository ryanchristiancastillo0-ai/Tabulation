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
  dbScores = []
) => {
  if (!dynamicUI || !selectedJudge) return;

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

    dropdowns.forEach(select => {
      // Sanitize the dropdown's parent wrapper to strip rogue AI styles
      const wrapper = select.closest('div, td, th');
      if (wrapper) {
        wrapper.style.minHeight = '';
        wrapper.style.height    = '';
        wrapper.style.position  = '';
        wrapper.style.overflow  = '';
      }

      // Always build 0–100 options regardless of criteria percentage
      let options = '<option value="">-</option>';
      for (let i = 0; i <= 100; i++) {
        options += `<option value="${i}">${i}</option>`;
      }
      select.innerHTML = options;

      const dbVal    = dbLookup[select.id];
      const localVal = localStorage.getItem(`judge_${selectedJudge}_${select.id}`);

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
    localStorage.setItem(`judge_${selectedJudge}_${e.target.id}`, e.target.value);
    if (saveToCache) saveToCache(e.target.id, e.target.value);
    recalculateRow(conId);
    updateRankings();
  };

  document.addEventListener('change', handleChange);
  activeChangeHandler = handleChange;
};

export { sanitizeAiHtml };