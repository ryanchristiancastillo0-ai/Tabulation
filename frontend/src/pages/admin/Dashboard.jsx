import React, { useState, useEffect } from 'react';
import CriteriaManager from '../../components/admin/CreteriaManager';
import Sidebar from '../../components/admin/Sidebar';
import { Trash2 } from 'lucide-react';
import { AlertTriangle, Info, X } from 'lucide-react';


function Dashboard() {
  const [dark, setDark] = useState(false);

  // config state
  const [contestName, setContestName] = useState('');
  const [contestType, setContestType] = useState('pageant');
  const [aiPrompt, setAiPrompt] = useState('');
  const [judgeCount, setJudgeCount] = useState(3);
  const [calculationType, setCalculationType] = useState('average'); 
  const [criteria, setCriteria] = useState([]); 
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newCrit, setNewCrit] = useState('');
  const [newWeight, setNewWeight] = useState(10);
  const [contestants, setContestants] = useState([]); 

  const [newName, setNewName] = useState('');
  const [activeNav, setActiveNav] = useState('overview');
  const [toast, setToast] = useState(false);

  // ── BACKEND CONFIG ──
  const API_BASE = "http://localhost:8080/api";

  // ── 1. LOAD DATA FROM BACKEND ON MOUNT ──
// ── 1. LOAD DATA FROM BACKEND ON MOUNT ──
  const loadAllData = async () => {
    try {
      const token = localStorage.getItem('adminToken'); // Pull token from storage

      const res = await fetch(`${API_BASE}/get-all-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // Pass the bouncer
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

  useEffect(() => {
    loadAllData();
  }, []);

  const totalWeight = criteria.reduce((s, c) => s + Number(c.weight || 0), 0);

  const addCriterion = () => {
    if (!newCrit.trim()) return;
    setCriteria([...criteria, { id: Date.now().toString(), name: newCrit.trim(), weight: Number(newWeight) }]);
    setNewCrit(''); 
    setNewWeight(10);
  };

  const addContestant = () => {
    if (!newName.trim()) return;
    const num = contestants.length + 1;
    setContestants([...contestants, { id: Date.now().toString(), name: newName.trim(), number: num }]);
    setNewName('');
  };

  // ── 2. UPDATED SAVE TO BACKEND ──
  // ── 2. UPDATED SAVE TO BACKEND ──
// ── 2. UPDATED SAVE TO BACKEND ──
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('adminToken'); // Get your access token

      const payload = {
        contest_name: contestName || '',
        contest_type: contestType || 'pageant',
        judge_count: Number(judgeCount) || 3,
        ai_prompt: aiPrompt || '',
        computation_type: calculationType || 'average',
        contestants: contestants.map(c => ({
          name: c.name || '',
          entry_number: Number(c.number) || 0
        })),
        criteria: criteria.map(cr => ({
          name: cr.name || '',
          percentage: Number(cr.weight) || 0
        }))
      };

      const response = await fetch(`${API_BASE}/save-config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Critical for authentication
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setToast(true);
        setTimeout(() => setToast(false), 2500);
        loadAllData(); // Refresh IDs from the DB
      } else {
        const errorData = await response.json();
        alert("Save failed: " + (errorData.error || "Unauthorized"));
      }
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  };
  // ── 3. DELETE ALL DATA ──
 // ── 3. DELETE ALL DATA ──
  const handleDeleteAll = async () => {
    setShowDeleteModal(false);
    try {
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`${API_BASE}/reset-data`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` // Token required to delete
        }
      });

      if (response.ok) {
        setToast(true);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const errorData = await response.json();
        alert("Reset failed: " + (errorData.error || "Unauthorized"));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

;

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="dash-root flex" style={{ minHeight: '100vh' }}>
        <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} dark={dark} setDark={setDark} />

        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)', padding: '36px 40px' }}>

          {/* top bar */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
                Admin Dashboard
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-.02em' }}>
                {contestName || 'Competition Setup'}
              </h1>
            </div>
            <button className="btn-primary" onClick={handleSave}>
              <span>✓</span> Save Config
            </button>
          </div>

          {/* ── OVERVIEW ── */}
          {activeNav === 'overview' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Contestants', value: contestants.length, color: 'var(--accent)', icon: '◉' },
                  { label: 'Judges', value: judgeCount, color: 'var(--green)', icon: '⚖' },
                  { label: 'Criteria', value: criteria.length, color: 'var(--amber)', icon: '◈' },
                  { label: 'Weight Total', value: `${totalWeight}%`, color: totalWeight === 100 ? 'var(--green)' : 'var(--red)', icon: '▦' },
                ].map(s => (
                  <div className="stat-card" key={s.label}>
                    <div style={{ fontSize: 20 }}>{s.icon}</div>
                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="panel p-6">
                <div className="section-heading">Quick Summary</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ fontSize: 13 }}>
                  <div style={{ color: 'var(--text2)' }}>
                    <span style={{ color: 'var(--text3)', fontWeight: 600, marginRight: 8 }}>Contest:</span>
                    <span style={{ color: 'var(--text1)', fontWeight: 600 }}>{contestName || <em style={{ color: 'var(--text3)' }}>Not set</em>}</span>
                  </div>
                  <div style={{ color: 'var(--text2)' }}>
                    <span style={{ color: 'var(--text3)', fontWeight: 600, marginRight: 8 }}>Type:</span>
                    <span className="badge badge-indigo">{contestType}</span>
                  </div>
                  <div style={{ color: 'var(--text2)' }}>
                    <span style={{ color: 'var(--text3)', fontWeight: 600, marginRight: 8 }}>Calculation:</span>
                    <span className="badge badge-indigo">{calculationType === 'average' ? 'Average Score' : 'Rank-Sum (By Place)'}</span>
                  </div>
                  <div style={{ color: 'var(--text2)' }}>
                    <span style={{ color: 'var(--text3)', fontWeight: 600, marginRight: 8 }}>Weight check:</span>
                    <span className={`badge ${totalWeight === 100 ? 'badge-green' : 'badge-red'}`}>
                      {totalWeight}% {totalWeight === 100 ? '✓ Valid' : '✗ Must be 100%'}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text2)' }}>
                    <span style={{ color: 'var(--text3)', fontWeight: 600, marginRight: 8 }}>AI Prompt:</span>
                    <span style={{ color: aiPrompt ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {aiPrompt ? '✓ Set' : '✗ Not set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* DANGER ZONE / DELETE BUTTON */}
              <div className="panel p-6" style={{ border: '1px solid #fee2e2', background: '#fef2f2' }}>
                <div className="section-heading" style={{ color: '#991b1b' }}>Danger Zone</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b' }}>Reset Competition Data</div>
                    <div style={{ fontSize: 12, color: '#b91c1c' }}>Clear all scores, criteria, and contestants for a new event.</div>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-900/20 transform active:scale-95 transition-all duration-200 border border-red-500/20"
                  >
                    <Trash2 size={18} className="group-hover:rotate-12 transition-transform duration-200" />
                    <span>Reset Competition Data</span>
                  </button>
                </div>
              </div>

              <div className="panel p-6">
                <div className="section-heading">Scoring Criteria</div>
                <div className="flex flex-col gap-3">
                  {criteria.map(c => (
                    <div key={c.id} className="flex items-center gap-3">
                      <div style={{ minWidth: 160, fontSize: 13, fontWeight: 500, color: 'var(--text1)' }}>{c.name}</div>
                      <div className="weight-bar-track">
                        <div className="weight-bar-fill" style={{ width: `${Math.min(c.weight, 100)}%` }} />
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', minWidth: 36, textAlign: 'right' }}>
                        {c.weight}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CONTEST INFO ── */}
          {activeNav === 'contest' && (
            <div className="panel p-6 flex flex-col gap-5">
              <div className="section-heading">Contest Information</div>
              <div>
                <div className="field-label">Contest Name</div>
                <input
                  className="field-input"
                  placeholder="e.g. Miss Barangay Fiesta 2025"
                  value={contestName}
                  onChange={e => setContestName(e.target.value)}
                />
              </div>
              <div>
                <div className="field-label">Contest Type</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['pageant', 'talent show', 'debate', 'sports', 'academic'].map(t => (
                    <button
                      key={t}
                      onClick={() => setContestType(t)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: 8,
                        border: `1.5px solid ${contestType === t ? 'var(--accent)' : 'var(--border)'}`,
                        background: contestType === t ? 'var(--accent-lt)' : 'var(--surface2)',
                        color: contestType === t ? 'var(--accent)' : 'var(--text2)',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        fontFamily: 'inherit',
                        transition: 'all .15s',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── AI PROMPT ── */}
          {activeNav === 'ai' && (
            <div className="panel p-6 flex flex-col gap-5">
              <div className="section-heading">AI Configuration</div>
              <div style={{
                background: 'var(--accent-lt)',
                border: '1px solid var(--accent-bd)',
                borderRadius: 10,
                padding: '14px 16px',
                fontSize: 13,
                color: 'var(--accent)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 16 }}>✦</span>
                <div>
                  This prompt tells the AI how to <strong>generate the Judge UI and Tabulation layout</strong>.
                </div>
              </div>
              <div>
                <div className="field-label">
                  AI Design Prompt
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                    {aiPrompt.length} chars
                  </span>
                </div>
                <textarea
                  className="field-input"
                  style={{ minHeight: 140 }}
                  placeholder={`Example: "Design a clean white Judge UI..."`}
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── CRITERIA ── */}
          {activeNav === 'criteria' && (
           <CriteriaManager 
  criteria={criteria} 
  setCriteria={setCriteria}
  newCrit={newCrit}
  setNewCrit={setNewCrit}
  addCriterion={addCriterion} 
/>
          )}

          {/* ── JUDGES ── */}
          {activeNav === 'judges' && (
            <div className="panel p-6 flex flex-col gap-8">
              <div className="section-heading">Judge & Calculation Configuration</div>

              <div>
                <div className="field-label" style={{ marginBottom: 12 }}>Number of Judges</div>
                <div className="flex items-center gap-4">
                  <button className="counter-btn" onClick={() => setJudgeCount(j => Math.max(1, j - 1))}>−</button>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, color: 'var(--accent)', minWidth: 48, textAlign: 'center' }}>
                    {judgeCount}
                  </span>
                  <button className="counter-btn" onClick={() => setJudgeCount(j => Math.min(20, j + 1))}>+</button>
                </div>
              </div>

              <div>
                <div className="field-label" style={{ marginBottom: 12 }}>Result Calculation Type</div>
                <div className="flex gap-4">
                  <div
                    onClick={() => setCalculationType('average')}
                    style={{
                      flex: 1, padding: '16px', borderRadius: 12, cursor: 'pointer', transition: 'all .2s',
                      border: `2px solid ${calculationType === 'average' ? 'var(--accent)' : 'var(--border)'}`,
                      background: calculationType === 'average' ? 'var(--accent-lt)' : 'var(--surface2)'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: calculationType === 'average' ? 'var(--accent)' : 'var(--text1)', fontSize: 14 }}>By Average</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Standard percentage-based average. Highest score wins.</div>
                  </div>

                  <div
                    onClick={() => setCalculationType('rank')}
                    style={{
                      flex: 1, padding: '16px', borderRadius: 12, cursor: 'pointer', transition: 'all .2s',
                      border: `2px solid ${calculationType === 'rank' ? 'var(--accent)' : 'var(--border)'}`,
                      background: calculationType === 'rank' ? 'var(--accent-lt)' : 'var(--surface2)'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: calculationType === 'rank' ? 'var(--accent)' : 'var(--text1)', fontSize: 14 }}>By Place (Rank-Sum)</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Rank points summed from all judges. Lowest sum wins.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CONTESTANTS ── */}
          {activeNav === 'contestants' && (
            <div className="panel p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="section-heading" style={{ margin: 0 }}>Contestants</div>
                <span className="badge badge-indigo">{contestants.length} registered</span>
              </div>
              <div className="flex flex-col gap-2">
                {contestants.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>{c.number}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)' }}>{c.name}</div>
                    </div>
                    <button className="btn-danger" onClick={() => setContestants(contestants.filter(x => x.id !== c.id))}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--surface2)', border: '1.5px dashed var(--border)', borderRadius: 10, padding: '16px' }}>
                <div className="field-label">Add Contestant</div>
                <div className="flex gap-2 mt-1">
                  <input className="field-input" placeholder="Full name…" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addContestant()} />
                  <button className="btn-primary" onClick={addContestant}>+ Add</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {toast && (
        <div className="save-toast">
          <span>✓</span> Configuration saved!
        </div>
      )}

      <Modal 
        isOpen={showDeleteModal}
        title="Reset System Data?"
        message="DANGER: This will permanently delete all contestants, criteria, and scores. This action cannot be undone."
        onConfirm={handleDeleteAll}
        onCancel={() => setShowDeleteModal(false)}
        type="danger"
      />
    </div>
  );
}

export default Dashboard;



// ── REUSABLE MODAL COMPONENT ──


const Modal = ({ isOpen, title, message, onConfirm, onCancel, type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop: Darker overlay with heavy blur for focus */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onCancel} 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Close Button (Top Right) */}
        <button 
          onClick={onCancel} 
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4">
          {/* Icon Section */}
          <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full 
            ${type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            {type === 'danger' ? <AlertTriangle size={24} /> : <Info size={24} />}
          </div>

          {/* Text Content */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 leading-6">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95"
          >
            Cancel
          </button>
          
          <button 
            onClick={onConfirm}
            className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all active:scale-95
              ${type === 'danger' 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
          >
            {type === 'danger' ? 'Confirm Reset' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};