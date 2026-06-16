// Module-level refs so we can clean up across calls
let activeObserver = null;
let activeChangeHandler = null;



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

    // Build db score lookup
    const dbLookup = {};
    if (Array.isArray(dbScores)) {
      dbScores.forEach(s => {
        dbLookup[`score-${s.contestant_id}-${s.criterion_id}`] = s.score_value;
      });
    }

    dropdowns.forEach(select => {
      const idParts     = select.id.split('-');
      const criterionId = parseInt(idParts[2]);

      const criterion = config.criteria.find(c => c.id === criterionId);
      const maxLimit  = criterion ? Number(criterion.percentage) : 10;

      // Rebuild options from real config (wipes AI hallucinations)
      let options = '<option value="">-</option>';
      for (let i = 1; i <= maxLimit; i++) {
        options += `<option value="${i}">${i}</option>`;
      }
      select.innerHTML = options;

      // Restore value: DB score takes priority over localStorage
      const dbVal    = dbLookup[select.id];
      const localVal = localStorage.getItem(`judge_${selectedJudge}_${select.id}`);

      if (dbVal !== undefined && dbVal !== null) {
        select.value = String(dbVal);
      } else if (localVal) {
        select.value = localVal;
      }
    });

    // Recalculate totals and rankings
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
        // Once resolved, clear the module ref too so it isn't disconnected again
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