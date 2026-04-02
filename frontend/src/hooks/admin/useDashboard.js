import { useState, useEffect } from 'react';

export const useDashboardData = (API_BASE) => {
  const [dark, setDark] = useState(false);
  const [contestName, setContestName] = useState('');
  const [contestType, setContestType] = useState('pageant');
  const [aiPrompt, setAiPrompt] = useState('');
  const [judgeCount, setJudgeCount] = useState(3);
  const [calculationType, setCalculationType] = useState('average'); 
  const [criteria, setCriteria] = useState([]); 
  const [contestants, setContestants] = useState([]); 
  const [activeNav, setActiveNav] = useState('overview');
  const [toast, setToast] = useState(false);

  const loadAllData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/get-all-data`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.settings) {
        setContestName(data.settings.contest_name || '');
        setContestType(data.settings.contest_type || 'pageant');
        setAiPrompt(data.settings.ai_prompt || '');
        setJudgeCount(data.settings.judge_count || 3);
        setCalculationType(data.settings.computation_type || 'average'); 
      }
      if (data.contestants) setContestants(data.contestants.map(c => ({ id: c.id, name: c.name, number: c.entry_number })));
      if (data.criteria) setCriteria(data.criteria.map(cr => ({ id: cr.id, name: cr.name, weight: cr.percentage })));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadAllData(); }, []);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const payload = {
        contest_name: contestName, contest_type: contestType, judge_count: Number(judgeCount),
        ai_prompt: aiPrompt, computation_type: calculationType,
        contestants: contestants.map(c => ({ name: c.name, entry_number: Number(c.number) })),
        criteria: criteria.map(cr => ({ name: cr.name, percentage: Number(cr.weight) }))
      };
      const response = await fetch(`${API_BASE}/save-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setToast(true);
        setTimeout(() => setToast(false), 2500);
        loadAllData();
      }
    } catch (err) { alert(err.message); }
  };

  return {
    state: { dark, contestName, contestType, aiPrompt, judgeCount, calculationType, criteria, contestants, activeNav, toast },
    setters: { setDark, setContestName, setContestType, setAiPrompt, setJudgeCount, setCalculationType, setCriteria, setContestants, setActiveNav },
    handleSave, loadAllData
  };
};