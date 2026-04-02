import React from 'react';
import { Trash2, Lock, Unlock } from 'lucide-react'; // ── ADDED ICONS ──
import CriteriaManager from './CreteriaManager';

const SectionRender = ({ 
  activeNav, contestName, setContestName, contestType, setContestType, 
  aiPrompt, setAiPrompt, judgeCount, setJudgeCount, calculationType, 
  setCalculationType, isJudgeLocked, setIsJudgeLocked, // ── ADDED PROPS ──
  criteria, setCriteria, contestants, setContestants, 
  newCrit, setNewCrit, newWeight, setNewWeight, newName, setNewName, 
  totalWeight, setShowDeleteModal 
}) => {

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

  return (
    <>
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
              {/* ── ADDED TO OVERVIEW ── */}
              <div style={{ color: 'var(--text2)' }}>
                <span style={{ color: 'var(--text3)', fontWeight: 600, marginRight: 8 }}>Judge Selection:</span>
                <span className={`badge ${isJudgeLocked ? 'badge-red' : 'badge-green'}`}>
                  {isJudgeLocked ? '🔒 Locked' : '🔓 Open'}
                </span>
              </div>
            </div>
          </div>

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
                    padding: '7px 16px', borderRadius: 8,
                    border: `1.5px solid ${contestType === t ? 'var(--accent)' : 'var(--border)'}`,
                    background: contestType === t ? 'var(--accent-lt)' : 'var(--surface2)',
                    color: contestType === t ? 'var(--accent)' : 'var(--text2)',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
                    fontFamily: 'inherit', transition: 'all .15s',
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
          <div style={{ background: 'var(--accent-lt)', border: '1px solid var(--accent-bd)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: 'var(--accent)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16 }}>✦</span>
            <div>This prompt tells the AI how to <strong>generate the Judge UI and Tabulation layout</strong>.</div>
          </div>
          <div>
            <div className="field-label">AI Design Prompt <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{aiPrompt.length} chars</span></div>
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
        <CriteriaManager criteria={criteria} setCriteria={setCriteria} newCrit={newCrit} setNewCrit={setNewCrit} addCriterion={addCriterion} />
      )}

      {/* ── JUDGES (RE-RESTORED FULL CODE + LOCK) ── */}
      {activeNav === 'judges' && (
        <div className="panel p-6 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="section-heading" style={{ margin: 0 }}>Judge & Calculation Configuration</div>
            
            {/* ── LOCK SWITCH ── */}
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <div className={`w-3 h-3 rounded-full ${isJudgeLocked ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
              <button 
                onClick={() => setIsJudgeLocked(!isJudgeLocked)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  isJudgeLocked ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-white text-slate-700 shadow-sm'
                }`}
              >
                {isJudgeLocked ? <Lock size={14} /> : <Unlock size={14} />}
                {isJudgeLocked ? 'JUDGES LOCKED' : 'LOCK JUDGES'}
              </button>
            </div>
          </div>

          <div>
            <div className="field-label" style={{ marginBottom: 12 }}>Number of Judges</div>
            <div className="flex items-center gap-4">
              <button className="counter-btn" onClick={() => setJudgeCount(j => Math.max(1, j - 1))}>−</button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, color: 'var(--accent)', minWidth: 48, textAlign: 'center' }}>{judgeCount}</span>
              <button className="counter-btn" onClick={() => setJudgeCount(j => Math.min(20, j + 1))}>+</button>
            </div>
          </div>
          <div>
            <div className="field-label" style={{ marginBottom: 12 }}>Result Calculation Type</div>
            <div className="flex gap-4">
              <div onClick={() => setCalculationType('average')} style={{ flex: 1, padding: '16px', borderRadius: 12, cursor: 'pointer', transition: 'all .2s', border: `2px solid ${calculationType === 'average' ? 'var(--accent)' : 'var(--border)'}`, background: calculationType === 'average' ? 'var(--accent-lt)' : 'var(--surface2)' }}>
                <div style={{ fontWeight: 800, color: calculationType === 'average' ? 'var(--accent)' : 'var(--text1)', fontSize: 14 }}>By Average</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Standard percentage-based average. Highest score wins.</div>
              </div>
              <div onClick={() => setCalculationType('rank')} style={{ flex: 1, padding: '16px', borderRadius: 12, cursor: 'pointer', transition: 'all .2s', border: `2px solid ${calculationType === 'rank' ? 'var(--accent)' : 'var(--border)'}`, background: calculationType === 'rank' ? 'var(--accent-lt)' : 'var(--surface2)' }}>
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
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)' }}>{c.name}</div></div>
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
    </>
  );
};

export default SectionRender;