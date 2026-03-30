  export const handleSubmitScore= async ({
      selectedJudge,
     config,
     clearCache,
     showStatus,
     API_BASE,
  }) => {
    if (!selectedJudge) return showStatus("Warning", "Select a Judge ID.", "warning");
    
    const payload = [];
    config.contestants.forEach(con => {
      config.criteria.forEach(crit => {
        const val = document.getElementById(`score-${con.id}-${crit.id}`)?.value;
        if (val) {
          payload.push({ contestantId: con.id, criterionId: crit.id, value: parseFloat(val) });
        }
      });
    });

    try {
      const res = await fetch(`${API_BASE}/judge/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judgeId: selectedJudge, scores: payload })
      });
      if (res.ok) {
        clearCache();
        showStatus("Success", "Scores uploaded!", "success");
      }
    } catch (err) {
      showStatus("Offline", "Saved locally.", "warning");
    }
  };