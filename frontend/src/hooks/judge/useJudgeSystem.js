import { useState, useEffect } from 'react';
import { useConnectivity } from './useConnectivity';
import { useJudgePersistence } from './useJudgePersistence';
import { getJudgeDataFetch } from '../../api/judge_data_fetch';
import { getHydra_and_Calcu } from './getHydration_and_Calculation';
import { handleSubmitScore } from '../../api/submitScoreBtn';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const useJudgeSystem = () => {
  const [selectedJudge, setSelectedJudge] = useState(localStorage.getItem('judge_id') || '');
  const [dynamicUI, setDynamicUI] = useState('');
  const [config, setConfig] = useState({ contestants: [], criteria: [], settings: {} });
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' });

  const isOnline = useConnectivity();
  const { saveToCache, loadCache, clearCache } = useJudgePersistence(selectedJudge, config.contestants);

  const showStatus = (title, message, type = 'success') => setModal({ show: true, title, message, type });
  const closeModal = () => setModal(prev => ({ ...prev, show: false }));

  // Logic for calculations
  const recalculateRow = (contestantId) => {
    const scores = document.querySelectorAll(`[id^="score-${contestantId}-"]`);
    const sum = Array.from(scores).reduce((acc, s) => acc + (parseFloat(s.value) || 0), 0);
    const cell = document.getElementById(`total-${contestantId}`);
    if (cell) cell.innerText = sum;
  };

  const updateRankings = () => {
    const standings = config.contestants.map(c => ({
      id: c.id,
      total: parseFloat(document.getElementById(`total-${c.id}`)?.innerText || 0)
    })).sort((a, b) => b.total - a.total);

    standings.forEach((item, idx) => {
      const cell = document.getElementById(`rank-${item.id}`);
      if (cell && item.total > 0) {
        const rank = idx + 1;
        const sfx = ["th", "st", "nd", "rd"][(rank % 10 > 3 || Math.floor(rank % 100 / 10) === 1) ? 0 : rank % 10];
        cell.innerText = `${rank}${sfx}`;
      }
    });
  };

  // --- FIX 1: Running the Fetch ---
  useEffect(() => {
    getJudgeDataFetch(API_BASE, setLoading, setConfig, setDynamicUI, showStatus);
  }, []);

  // --- FIX 2: Running the Hydration only when UI is ready ---
  useEffect(() => {
    if (dynamicUI && config.criteria.length > 0) {
      getHydra_and_Calcu(
        dynamicUI, 
        config, 
        saveToCache, 
        recalculateRow, 
        updateRankings, 
        selectedJudge, 
        loadCache
      );
    }
  }, [dynamicUI, config, selectedJudge]);

 const submitToDB = async () => {
  if (!selectedJudge) return showStatus("Error", "Please select a judge.", "error");
  
  // Collect scores from the AI-generated UI
  const scoreElements = document.querySelectorAll('.score-dropdown');
  const scores = Array.from(scoreElements).map(el => {
    const [ , contestantId, criterionId] = el.id.split('-');
    return { 
      contestantId: parseInt(contestantId), 
      criterionId: parseInt(criterionId), 
      value: parseFloat(el.value) || 0 
    };
  });

  try {
    setLoading(true);
    const response = await fetch(`${API_BASE}/judge/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgeId: selectedJudge, scores })
    });

    const result = await response.json();

    if (result.success) {
      showStatus("Success", "Scores submitted and locked!", "success");
      
      // --- THE FIX: RELOAD AFTER 2 SECONDS ---
      // We give the user 2 seconds to see the "Success" modal before refreshing
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  } catch (err) {
    showStatus("Error", "Failed to connect to server.", "error");
  } finally {
    setLoading(false);
  }
};
  return { 
    selectedJudge, dynamicUI, config, loading, modal, isOnline, closeModal, submitToDB,
    updateJudge: (val) => { 
      setSelectedJudge(val); 
      localStorage.setItem('judge_id', val); 
      window.location.reload(); 
    } 
  };
};