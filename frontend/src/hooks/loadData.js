export const loadAllData = async (API_BASE, setters) => {
  const {
    setContestName,
    setContestType,
    setAiPrompt,
    setJudgeCount,
    setCalculationType,
    setIsJudgeLocked,
    setContestants,
    setCriteria
  } = setters;

  try {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/get-all-data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();

    if (data.settings) {
      setContestName(data.settings.contest_name || '');
      setContestType(data.settings.contest_type || 'pageant');
      setAiPrompt(data.settings.ai_prompt || '');
      setJudgeCount(data.settings.judge_count || 3);
      setCalculationType(data.settings.computation_type || 'average');
      setIsJudgeLocked(!!data.settings.is_judge_locked); // ── ADDED ──
    }

    if (data.contestants) {
      setContestants(data.contestants.map(c => ({
        id: c.id,
        name: c.name,
        number: c.entry_number
      })));
    }

    if (data.criteria) {
      setCriteria(data.criteria.map(cr => ({
        id: cr.id,
        name: cr.name,
        weight: cr.percentage
      })));
    }
  } catch (err) {
    console.error("Failed to load dashboard data:", err);
  }
};