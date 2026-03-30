export const getHydra_and_Calcu = (dynamicUI, config, saveToCache, recalculateRow, updateRankings, selectedJudge, loadCache) => {
  const dropdowns = document.querySelectorAll('.score-dropdown');
  const currentCache = loadCache() || {};

  dropdowns.forEach(select => {
    const [_, contestantId, criterionId] = select.id.split('-');
    const criterion = config.criteria.find(c => c.id === parseInt(criterionId));
    
    // Fill the numbers 1 to Max based on Criterion Percentage
    if (select.children.length <= 1) {
      let options = '<option value="">-</option>';
      const max = criterion?.percentage || 10;
      for (let i = 1; i <= max; i++) {
        options += `<option value="${i}">${i}</option>`;
      }
      select.innerHTML = options;
    }

    // Restore value from LocalStorage
    if (currentCache[select.id]) {
      select.value = currentCache[select.id];
    }
  });

  // Initial calculation to show totals on load
  config.contestants.forEach(c => recalculateRow(c.id));
  updateRankings();

  const handleChange = (e) => {
    if (e.target.classList.contains('score-dropdown')) {
      const conId = e.target.id.split('-')[1];
      saveToCache(e.target.id, e.target.value);
      recalculateRow(conId);
      updateRankings();
    }
  };

  document.addEventListener('change', handleChange);
  // No return needed here as it's managed by the hook's useEffect cleanup if added
};