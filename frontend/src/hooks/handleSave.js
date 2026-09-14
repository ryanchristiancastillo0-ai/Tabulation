export const handleSaveData = async (API_BASE, data, helpers) => {
  const { setToast, loadAllData } = helpers;
  
  try {
    const token = localStorage.getItem('adminToken');
    const payload = {
      contest_name: data.contestName || '',
      contest_type: data.contestType || 'pageant',
      judge_count: Number(data.judgeCount) || 3,
      ai_prompt: data.aiPrompt || '',
      computation_type: data.calculationType || 'average',
      is_judge_locked: data.isJudgeLocked ? 1 : 0, // ── ADDED ──
      contestants: data.contestants.map(c => ({
        name: c.name || '',
        entry_number: Number(c.number) || 0
      })),
      criteria: data.criteria.map(cr => ({
        name: cr.name || '',
        percentage: Number(cr.weight) || 0
      }))
    };

    const response = await fetch(`${API_BASE}/save-config`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      setToast(true);
      setTimeout(() => setToast(false), 2500);
      loadAllData();
    } else {
      const errorData = await response.json();
      alert("Save failed: " + (errorData.error || "Unauthorized"));
    }
  } catch (err) {
    alert("Save failed: " + err.message);
  }
};