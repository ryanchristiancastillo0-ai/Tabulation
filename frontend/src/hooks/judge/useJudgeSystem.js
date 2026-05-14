import { useState, useEffect, useRef } from 'react';
import { useConnectivity } from './useConnectivity';
import { useJudgePersistence } from './useJudgePersistence';
import { getHydra_and_Calcu } from './getHydration_and_Calculation';
import apiClient from '../../utils/apiClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function getSchoolId() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('school_id')) return params.get('school_id');
    const user = localStorage.getItem('adminUser');
    if (user) return JSON.parse(user)?.school_id || 1;
    const auth = localStorage.getItem('auth');
    if (auth) return JSON.parse(auth)?.admin?.school_id || 1;
    return 1;
  } catch {
    return 1;
  }
}

// Plain fetch for PUBLIC judge routes (no JWT needed)
async function judgePost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function judgeGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const useJudgeSystem = () => {
  const [selectedJudge, setSelectedJudge] = useState(localStorage.getItem('judge_id') || '');
  const [dynamicUI, setDynamicUI]         = useState('');
  const [config, setConfig]               = useState({ contestants: [], criteria: [], settings: {} });
  const [loading, setLoading]             = useState(false);
  const [modal, setModal]                 = useState({ show: false, title: '', message: '', type: 'success' });

  const uiRendered = useRef(false);

  const isOnline = useConnectivity();
  const { saveToCache, loadCache } = useJudgePersistence(selectedJudge, config.contestants);

  const showStatus = (title, message, type = 'success') =>
    setModal({ show: true, title, message, type });
  const closeModal = () => setModal(prev => ({ ...prev, show: false }));

  const recalculateRow = (contestantId) => {
    const scores = document.querySelectorAll(`[id^="score-${contestantId}-"]`);
    const sum    = Array.from(scores).reduce((acc, s) => acc + (parseFloat(s.value) || 0), 0);
    const cell   = document.getElementById(`total-${contestantId}`);
    if (cell) cell.innerText = sum.toFixed(2);
  };

  const updateRankings = () => {
    if (!config.contestants?.length) return;

    const standings = config.contestants
      .map(c => ({
        id:    c.id,
        total: parseFloat(document.getElementById(`total-${c.id}`)?.innerText || 0),
      }))
      .sort((a, b) => b.total - a.total);

    standings.forEach((item, idx) => {
      const cell = document.getElementById(`rank-${item.id}`);
      if (cell && item.total > 0) {
        const rank = idx + 1;
        const sfx  = ['th','st','nd','rd'][
          (rank % 10 > 3 || Math.floor(rank % 100 / 10) === 1) ? 0 : rank % 10
        ];
        cell.innerText = `${rank}${sfx}`;
      }
    });
  };

  // ── STEP 1: Fetch config via apiClient (JWT-authenticated) ──────
  useEffect(() => {
    setLoading(true);
    apiClient.get('/get-all-data')
      .then(data => {
        setConfig({
          contestants: data.contestants || [],
          criteria:    data.criteria    || [],
          settings:    data.settings    || {},
        });
      })
      .catch(err => showStatus('Error', err.message || 'Failed to load contest config.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  // ── STEP 2: Call render-ui only when config has real data ───────
  useEffect(() => {
    const { contestants, criteria, settings } = config;

    if (!contestants?.length || !criteria?.length) return; // wait for real data
    if (uiRendered.current) return;                        // only fire once
    uiRendered.current = true;

    const school_id = getSchoolId();
    setLoading(true);

    judgePost('/judge/render-ui', {
      contestants,
      criteria,
      school_id,
      aiPrompt: settings?.ai_prompt || '',
    })
      .then(data => {
        if (data.html || data.headerHtml) {
          setDynamicUI(data);
        } else {
          showStatus('Error', data.error || 'UI generation failed.', 'error');
        }
      })
      .catch(err => showStatus('Error', err.message || 'Failed to generate judge interface.', 'error'))
      .finally(() => setLoading(false));

  }, [config]);

  // ── STEP 3: Hydrate UI once dynamicUI + config are both ready ───
  useEffect(() => {
    if (dynamicUI && config.criteria?.length > 0) {
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

  // ── Submit scores (public route, no JWT) ────────────────────────
  const submitToDB = async () => {
    if (!selectedJudge) return showStatus('Error', 'Please select a judge.', 'error');

    const school_id     = getSchoolId();
    const scoreElements = document.querySelectorAll('.score-dropdown');

    if (!scoreElements.length) {
      return showStatus('Error', 'No scores found to submit.', 'error');
    }

    const scores = Array.from(scoreElements).map(el => {
      const [, contestantId, criterionId] = el.id.split('-');
      return {
        contestantId: parseInt(contestantId),
        criterionId:  parseInt(criterionId),
        value:        parseFloat(el.value) || 0,
      };
    });

    setLoading(true);
    try {
      const data = await judgePost('/judge/submit', {
        judgeId: selectedJudge,
        scores,
        school_id,
      });

      if (data.success) {
        showStatus('Success', 'Scores submitted successfully!', 'success');
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err) {
      showStatus('Error', err.message || 'Failed to connect to server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    selectedJudge,
    dynamicUI,
    config,
    loading,
    modal,
    isOnline,
    closeModal,
    submitToDB,
    updateJudge: (val) => {
      setSelectedJudge(val);
      localStorage.setItem('judge_id', val);
      window.location.reload();
    },
  };
};