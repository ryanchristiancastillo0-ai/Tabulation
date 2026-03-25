import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, XCircle, X } from 'lucide-react';

// ── MODERN MODAL COMPONENT ──
const StatusModal = ({ isOpen, title, message, type, onClose }) => {
  if (!isOpen) return null;

  const themes = {
    success: {
      icon: <CheckCircle2 className="text-emerald-500" size={44} />,
      btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
      accent: "border-emerald-100 bg-emerald-50/50"
    },
    error: {
      icon: <XCircle className="text-rose-500" size={44} />,
      btn: "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
      accent: "border-rose-100 bg-rose-50/50"
    },
    warning: {
      icon: <AlertCircle className="text-amber-500" size={44} />,
      btn: "bg-amber-600 hover:bg-amber-700 shadow-amber-200",
      accent: "border-amber-100 bg-amber-50/50"
    }
  };

  const current = themes[type] || themes.success;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 transform transition-all animate-in zoom-in-95 duration-200">
        <div className="p-8 flex flex-col items-center text-center">
          <div className={`mb-6 p-4 rounded-full border-4 ${current.accent}`}>
            {current.icon}
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">{title}</h3>
          <p className="text-slate-500 font-medium leading-relaxed mb-8">{message}</p>
          <button
            onClick={onClose}
            className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 ${current.btn}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const JudgeTable = () => {
  // --- STATE MANAGEMENT ---
  const [selectedJudge, setSelectedJudge] = useState(localStorage.getItem('judge_id') || '');
  const [dynamicUI, setDynamicUI] = useState(''); 
  const [config, setConfig] = useState({ contestants: [], criteria: [], settings: {} });
  const [loading, setLoading] = useState(false);
  
  const [modal, setModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success', 
  });

  const API_BASE = "http://localhost:8080/api";

  // --- MODAL HELPERS ---
  const showStatus = (title, message, type = 'success') => {
    setModal({ show: true, title, message, type });
  };
  const closeModal = () => setModal({ ...modal, show: false });

  // --- 1. INITIAL LOAD: DATA & UI FETCH ---
  useEffect(() => {
    const loadSystem = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/get-all-data`);
        const data = await res.json();
        
        if (!data.contestants?.length || !data.criteria?.length) {
          setConfig(data);
          setLoading(false);
          return;
        }
        setConfig(data);

        const uiRes = await fetch(`${API_BASE}/judge/render-ui`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            aiPrompt: data.settings?.ai_prompt || "Professional Table Layout",
            contestants: data.contestants,
            criteria: data.criteria
          })
        });

        const uiData = await uiRes.json();
        const cleanHTML = uiData.html?.replace(/```html/g, "")?.replace(/```/g, "")?.trim();
        setDynamicUI(cleanHTML || "");

      } catch (err) {
        console.error("Initialization failed", err);
        showStatus("Connection Error", "Failed to load system data.", "error");
      } finally {
        setLoading(false);
      }
    };
    
    loadSystem();
  }, []);

  // --- 2. HYDRATION & LIVE CALCULATION ---
  useEffect(() => {
    if (!dynamicUI || config.contestants.length === 0) return;

    const dropdowns = document.querySelectorAll('.score-dropdown');
    dropdowns.forEach(select => {
      const maxWeight = parseInt(select.getAttribute('data-max')) || 10;
      if (select.options.length <= 1) {
        for (let i = 1; i <= maxWeight; i++) {
          const opt = document.createElement('option');
          opt.value = i;
          opt.innerText = i;
          select.appendChild(opt);
        }
      }
    });

    const updateRankings = () => {
      const standings = config.contestants.map(c => {
        const totalCell = document.getElementById(`total-${c.id}`);
        return { id: c.id, total: parseFloat(totalCell?.innerText || 0) };
      });

      const sorted = [...standings].sort((a, b) => b.total - a.total);

      standings.forEach(item => {
        const rankCell = document.getElementById(`rank-${item.id}`);
        if (rankCell && item.total > 0) {
          const rankIndex = sorted.findIndex(s => s.id === item.id) + 1;
          const suffix = ["st", "nd", "rd"][((rankIndex + 9) % 10) - 1] || "th";
          const finalRank = rankIndex + (rankIndex >= 11 && rankIndex <= 13 ? "th" : suffix);
          
          rankCell.innerText = finalRank;
          rankCell.style.color = rankIndex === 1 ? "#d97706" : "#64748b";
          rankCell.style.fontWeight = "900";
        }
      });
    };

    const handleCalc = (e) => {
      if (e.target.id.startsWith('score-')) {
        const [_, contestantId] = e.target.id.split('-');
        const rowScores = document.querySelectorAll(`[id^="score-${contestantId}-"]`);
        let sum = 0;
        rowScores.forEach(s => sum += parseFloat(s.value) || 0);
        
        const totalCell = document.getElementById(`total-${contestantId}`);
        if (totalCell) {
          totalCell.innerText = sum;
        }
        updateRankings();
      }
    };

    document.addEventListener('change', handleCalc);
    return () => document.removeEventListener('change', handleCalc);
  }, [dynamicUI, config]);

  // --- 3. ACTIONS ---
  const handleJudgeChange = (id) => {
    setSelectedJudge(id);
    localStorage.setItem('judge_id', id);
  };

  const submitToDB = async () => {
    if (!selectedJudge) {
      showStatus("Identity Missing", "Please select a Judge ID.", "warning");
      return;
    }
    
    const payload = []; 
    config.contestants.forEach(con => {
      config.criteria.forEach(crit => {
        const input = document.getElementById(`score-${con.id}-${crit.id}`);
        if (input && input.value !== "") {
          payload.push({
            contestantId: con.id,
            criterionId: crit.id,
            value: parseFloat(input.value)
          });
        }
      });
    });

    try {
      const res = await fetch(`${API_BASE}/judge/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judgeId: selectedJudge, scores: payload })
      });
      
      if (res.ok) showStatus("Success", "Scores recorded!", "success");
    } catch (err) {
      showStatus("Error", "Network failure.", "error");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-slate-50">
      
      {/* ── INTEGRATED MODERN MODAL ── */}
      <StatusModal 
        isOpen={modal.show}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none mb-1">Judge Terminal</h2>
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">{config.settings?.contest_name || "System Offline"}</p>
        </div>
        
        <select 
          value={selectedJudge}
          onChange={(e) => handleJudgeChange(e.target.value)} 
          className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
        >
          <option value="">Select ID</option>
          {Array.from({ length: config.settings?.judge_count || 0 }, (_, i) => (
            <option key={i+1} value={i+1}>Judge {i+1}</option>
          ))}
        </select>
      </div>

      {/* TABLE AREA */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-4 overflow-x-auto min-h-[450px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 text-center">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <div className="font-black text-slate-300 uppercase tracking-widest text-xs">Generating UI...</div>
          </div>
        ) : (
          <div 
            className="ai-generated-ui"
            dangerouslySetInnerHTML={{ __html: dynamicUI || '<div class="py-20 text-center text-slate-300 font-medium">Awaiting live configuration...</div>' }} 
          />
        )}
      </div>

      {/* SUBMIT */}
      <div className="mt-10 flex justify-center">
        <button 
          onClick={submitToDB} 
          disabled={!selectedJudge || loading}
          className="relative px-20 py-5 bg-indigo-600 text-white rounded-[22px] font-black text-xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-xl shadow-indigo-100 active:scale-95 group overflow-hidden"
        >
          <span className="relative z-10">Submit Final Scores</span>
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
};

export default JudgeTable;