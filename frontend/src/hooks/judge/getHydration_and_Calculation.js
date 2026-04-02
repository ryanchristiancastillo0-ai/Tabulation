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

  const applyData = () => {
    const dropdowns = document.querySelectorAll('.score-dropdown');
    
    // 1. Wait until the AI-generated table is actually in the DOM
    if (dropdowns.length === 0) return false; 

    // Create a lookup for database scores
    const dbLookup = {};
    if (Array.isArray(dbScores)) {
      dbScores.forEach(s => {
        dbLookup[`score-${s.contestant_id}-${s.criterion_id}`] = s.score_value;
      });
    }

    dropdowns.forEach(select => {
      // Extract IDs from the AI-generated ID: score-{contestantId}-{criterionId}
      const idParts = select.id.split('-'); 
      const criterionId = parseInt(idParts[2]);
      
      // Find the real percentage/max from your local config
      const criterion = config.criteria.find(c => c.id === criterionId);
      const maxLimit = criterion ? Number(criterion.percentage) : 10;

      // --- THE KEY FIX: FORCE OVERRIDE ---
      // We don't check 'if (select.children.length <= 1)' anymore.
      // We wipe the select clean to remove AI hallucinations (0, 100, etc.)
      let options = '<option value="">-</option>';
      for (let i = 1; i <= maxLimit; i++) {
        options += `<option value="${i}">${i}</option>`;
      }
      
      // Overwrite AI-generated options with your real criteria data
      select.innerHTML = options;

      // 2. SET THE VALUE: Priority (Database > LocalStorage)
      const dbVal = dbLookup[select.id];
      const localVal = localStorage.getItem(`judge_${selectedJudge}_${select.id}`);

      if (dbVal !== undefined && dbVal !== null) {
        select.value = dbVal;
      } else if (localVal) {
        select.value = localVal;
      }
    });

    // 3. Trigger Math (Total & Rank)
    if (config.contestants) {
      config.contestants.forEach(c => recalculateRow(c.id));
      updateRankings();
    }
    return true; 
  };

  // The "Watchdog" that waits for the AI HTML to finish loading
  const observer = new MutationObserver((mutations, obs) => {
    if (applyData()) {
      obs.disconnect(); 
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial attempt in case the DOM is already ready
  applyData();

  // Handle manual changes for real-time LocalStorage backup
  const handleChange = (e) => {
    if (e.target.classList.contains('score-dropdown')) {
      const conId = e.target.id.split('-')[1];
      
      // Save to localStorage immediately so it survives a reload
      localStorage.setItem(`judge_${selectedJudge}_${e.target.id}`, e.target.value);
      
      if (saveToCache) saveToCache(e.target.id, e.target.value);
      recalculateRow(conId);
      updateRankings();
    }
  };

  document.removeEventListener('change', handleChange);
  document.addEventListener('change', handleChange);
};