import React, { useState, useEffect, useRef } from 'react';
import {
  Trash2, Lock, Unlock, Upload, CheckCircle, AlertCircle, Loader,
  Users, Scale, ListChecks, PieChart, LayoutDashboard, Trophy,
  Tag, Calculator, Sparkles, ShieldCheck, AlertTriangle,
  Building2, Star, Activity,
} from 'lucide-react';
import CriteriaManager from './CreteriaManager';
import apiClient from '../../utils/apiClient';
import { useContestContext } from '../../providers/ContestContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  boxShadow: 'var(--shadow-sm)',
  padding: 24,
};

// ─── OVERVIEW ────────────────────────────────────────────────────────────────

const OverviewSection = ({
  contestants, judgeCount, criteria, totalWeight,
  contestName, contestType, calculationType, aiPrompt,
  isJudgeLocked, setShowDeleteModal,
  schoolLogo, backgroundLogo, schoolName, portalName,
  logoRadius,
}) => (
  <div className="flex flex-col gap-6">

    {(schoolLogo || portalName || schoolName) && (
      <div style={{
        ...card,
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'linear-gradient(135deg, var(--accent-lt), var(--surface))',
        position: 'relative', overflow: 'hidden',
      }}>
        {backgroundLogo && (
          <img src={backgroundLogo} alt="bg" style={{
            position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
            width: 80, height: 80, objectFit: 'contain', opacity: 0.10,
          }} />
        )}
        {schoolLogo ? (
          <img src={schoolLogo} alt="school logo" style={{
            width: 52, height: 52,
            borderRadius: logoRadius >= 999 ? '50%' : `${logoRadius}px`,
            objectFit: 'cover',
            border: '2px solid var(--accent-bd)',
            transition: 'border-radius .2s',
          }} />
        ) : (
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: 'var(--accent-lt)', border: '1.5px solid var(--accent-bd)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={22} style={{ color: 'var(--accent)' }} />
          </div>
        )}
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text1)' }}>
            {portalName || 'Your Portal'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            {schoolName || 'Your School'}
          </div>
        </div>
      </div>
    )}

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Contestants', value: contestants.length, color: 'var(--accent)', bg: 'var(--accent-lt)', border: 'var(--accent-bd)', icon: <Users size={18} /> },
        { label: 'Judges', value: judgeCount, color: 'var(--accent-mid)', bg: 'var(--accent-lt)', border: 'var(--accent-bd)', icon: <Scale size={18} /> },
        { label: 'Criteria', value: criteria.length, color: 'var(--amber)', bg: '#fffbeb', border: '#fde68a', icon: <ListChecks size={18} /> },
        {
          label: 'Weight Total',
          value: `${totalWeight}%`,
          color: totalWeight === 100 ? 'var(--accent-mid)' : 'var(--red)',
          bg: totalWeight === 100 ? 'var(--accent-lt)' : '#fff1f2',
          border: totalWeight === 100 ? 'var(--accent-bd)' : '#fecdd3',
          icon: <PieChart size={18} />,
        },
      ].map(s => (
        <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {s.icon}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>

    <div style={card}>
      <div className="flex items-center gap-2 mb-5">
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-lt)', border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LayoutDashboard size={15} style={{ color: 'var(--accent)' }} />
        </div>
        <span className="section-heading" style={{ margin: 0 }}>Quick Summary</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ fontSize: 13 }}>
        {[
          { label: 'Contest', icon: <Trophy size={13} />, value: contestName ? <span style={{ color: 'var(--text1)', fontWeight: 600 }}>{contestName}</span> : <em style={{ color: 'var(--text3)' }}>Not set</em> },
          { label: 'Type', icon: <Tag size={13} />, value: <span className="badge badge-indigo" style={{ textTransform: 'capitalize' }}>{contestType}</span> },
          { label: 'Calculation', icon: <Calculator size={13} />, value: <span className="badge badge-indigo">{calculationType === 'average' ? 'Average Score' : 'Rank-Sum (By Place)'}</span> },
          { label: 'Weight', icon: <PieChart size={13} />, value: <span className={`badge ${totalWeight === 100 ? 'badge-green' : 'badge-red'}`}>{totalWeight}% {totalWeight === 100 ? '✓ Valid' : '✗ Must be 100%'}</span> },
          { label: 'AI Prompt', icon: <Sparkles size={13} />, value: <span style={{ color: aiPrompt ? 'var(--accent-mid)' : 'var(--red)', fontWeight: 600, fontSize: 12 }}>{aiPrompt ? '✓ Configured' : '✗ Not set'}</span> },
          { label: 'Judge Access', icon: <ShieldCheck size={13} />, value: <span className={`badge ${isJudgeLocked ? 'badge-red' : 'badge-green'}`}>{isJudgeLocked ? 'Locked' : 'Open'}</span> },
        ].map(({ label, icon, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text3)', fontWeight: 600, minWidth: 110, fontSize: 12 }}>
              <span style={{ color: 'var(--text3)', opacity: 0.7 }}>{icon}</span>
              {label}
            </div>
            <div style={{ marginLeft: 'auto' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>

    <div style={{ ...card, border: '1px solid #fecdd3', background: '#fff1f2' }}>
      <div className="flex items-center gap-2 mb-4">
        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#ffe4e6', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={15} style={{ color: '#be123c' }} />
        </div>
        <span className="section-heading" style={{ margin: 0, color: '#9f1239' }}>Danger Zone</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9f1239' }}>Reset Competition Data</div>
          <div style={{ fontSize: 12, color: '#be123c', marginTop: 3 }}>Clear all scores, criteria, and contestants for a new event.</div>
        </div>
        <button onClick={() => setShowDeleteModal(true)} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#be123c', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(190,18,60,0.25)', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#9f1239'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#be123c'; }}>
          <Trash2 size={14} /> Reset Data
        </button>
      </div>
    </div>

    <div style={card}>
      <div className="flex items-center gap-2 mb-5">
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-lt)', border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ListChecks size={15} style={{ color: 'var(--accent)' }} />
        </div>
        <span className="section-heading" style={{ margin: 0 }}>Scoring Criteria</span>
        <span className="badge badge-indigo" style={{ marginLeft: 'auto' }}>{criteria.length} criteria</span>
      </div>
      <div className="flex flex-col gap-2">
        {criteria.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent-lt)', border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Star size={13} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>{c.name}</div>
            <div style={{ flex: 2, margin: '0 8px' }}>
              <div className="weight-bar-track">
                <div className="weight-bar-fill" style={{ width: `${Math.min(c.weight, 100)}%` }} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent)', minWidth: 40, textAlign: 'right' }}>{c.weight}%</div>
          </div>
        ))}
        {criteria.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '32px 0', color: 'var(--text3)' }}>
            <ListChecks size={28} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: 13, fontStyle: 'italic' }}>No criteria added yet.</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ─── CONTEST INFO ─────────────────────────────────────────────────────────────

const ContestInfoSection = ({ contestName, setContestName, contestType, setContestType }) => (
  <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div className="section-heading">Contest Information</div>
    <div>
      <div className="field-label">Contest Name</div>
      <input className="field-input" placeholder="e.g. Miss Barangay Fiesta 2025" value={contestName} onChange={e => setContestName(e.target.value)} />
    </div>
    <div>
      <div className="field-label">Contest Type</div>
      <div className="flex flex-wrap gap-2 mt-1">
        {['pageant', 'talent show', 'debate', 'sports', 'academic'].map(t => (
          <button key={t} onClick={() => setContestType(t)} style={{ padding: '7px 16px', borderRadius: 10, border: `1.5px solid ${contestType === t ? 'var(--accent-mid)' : 'var(--border)'}`, background: contestType === t ? 'var(--accent-lt)' : 'var(--surface2)', color: contestType === t ? 'var(--accent)' : 'var(--text2)', fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'inherit', transition: 'all .15s', boxShadow: contestType === t ? '0 0 0 3px var(--accent-lt)' : 'none' }}>
            {t}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ─── AI CONFIG ────────────────────────────────────────────────────────────────

const THEME_PRESETS = [
  { name: 'Clean & Minimal', desc: 'White, sharp, corporate', swatches: ['#ffffff', '#f4f4f4', '#1a1a1a'], prompt: 'Design a clean, minimal white Judge UI with light gray borders, sharp sans-serif typography, and a professional corporate feel. Use subtle shadows and ample whitespace.' },
  { name: 'Dark & Elegant', desc: 'Navy, gold, premium', swatches: ['#1a1f2e', '#2a2f40', '#f0c040'], prompt: 'Design an elegant dark-mode Judge UI with deep navy or charcoal backgrounds, gold accent colors, and a premium formal feel. Use glowing borders and luxury typography.' },
  { name: 'Pageant Glam', desc: 'Pink, rose gold, festive', swatches: ['#f9a8d4', '#e879f9', '#f59e0b'], prompt: 'Design a vibrant pageant-style Judge UI with rose gold, pink, and purple gradients. Use glamorous fonts, sparkle accents, and a festive competition atmosphere.' },
  { name: 'Sport & Bold', desc: 'Green, white, athletic', swatches: ['#15803d', '#ffffff', '#1e293b'], prompt: 'Design a bold sporty Judge UI with deep green and white colors, strong grid layouts, and an athletic competition feel. Use bold numbers and a high-contrast scoreboard style.' },
  { name: 'Academic Classic', desc: 'Navy, cream, burgundy', swatches: ['#1e3a5f', '#fdf8f0', '#8b1a1a'], prompt: 'Design a classic academic Judge UI inspired by university aesthetics. Use deep navy blue, cream white, and burgundy red. Formal serif typography, structured tables, and a scholarly tone.' },
  { name: 'Tech & Futuristic', desc: 'Dark, electric blue, mono', swatches: ['#0f172a', '#0ea5e9', '#06b6d4'], prompt: 'Design a modern tech-style Judge UI with electric blue, cyan, and dark slate backgrounds. Use monospace fonts, terminal-inspired borders, and a futuristic digital aesthetic.' },
];

const QUICK_TAGS = ['Use large scoreboard numbers', 'Add animated transitions', 'Dark mode table', 'Mobile-friendly layout', 'Clean Design'];

const AIConfigSection = ({ aiPrompt, setAiPrompt }) => {
  const [activeTheme, setActiveTheme] = React.useState(null);
  const selectTheme = (theme) => { setActiveTheme(theme.name); setAiPrompt(theme.prompt); };
  const appendTag = (tag) => { setAiPrompt(prev => prev.trim() ? `${prev.trim()}. ${tag}.` : `${tag}.`); };

  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-heading">AI Configuration</div>
      <div style={{ background: 'var(--accent-lt)', border: '1px solid var(--accent-bd)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: 'var(--accent)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 16 }}>✦</span>
        <div>This prompt tells the AI how to <strong>generate the Judge UI and Tabulation layout</strong>. Pick a theme preset or write your own below.</div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10 }}>Design theme presets</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
          {THEME_PRESETS.map(theme => {
            const isActive = activeTheme === theme.name;
            return (
              <button key={theme.name} onClick={() => selectTheme(theme)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: '10px 12px', borderRadius: 12, textAlign: 'left', border: isActive ? '2px solid var(--accent-mid)' : '1px solid var(--border)', background: isActive ? 'var(--accent-lt)' : 'var(--surface2)', cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit', boxShadow: isActive ? '0 0 0 3px var(--accent-lt)' : 'none' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {theme.swatches.map((color, i) => (
                    <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: color, border: color === '#ffffff' || color === '#fdf8f0' ? '1px solid var(--border)' : 'none' }} />
                  ))}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? 'var(--accent)' : 'var(--text1)' }}>{theme.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{theme.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div className="field-label" style={{ margin: 0 }}>AI Design Prompt</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>{aiPrompt.length} chars</span>
        </div>
        <textarea className="field-input" style={{ minHeight: 130 }} placeholder='Or write your own: "Design a Judge UI with..."' value={aiPrompt} onChange={e => { setAiPrompt(e.target.value); setActiveTheme(null); }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {QUICK_TAGS.map(tag => (
            <button key={tag} onClick={() => appendTag(tag)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-bd)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; }}>
              + {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── JUDGES ───────────────────────────────────────────────────────────────────
// ↓↓↓ THIS IS THE KEY CHANGE — uses ContestContext instead of local prop ↓↓↓

const JudgesSection = ({ judgeCount, setJudgeCount, calculationType, setCalculationType }) => {
  // Pull live lock state + actions from context
  const { isJudgeLocked, toggleLock, lockLoading, lockError } = useContestContext();

  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div className="flex items-center justify-between">
        <div className="section-heading" style={{ margin: 0 }}>Judge & Calculation Configuration</div>

        {/* ── Real-time lock toggle ── */}
        <div className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <div className="w-2.5 h-2.5 rounded-full" style={{
            background: isJudgeLocked ? 'var(--red)' : 'var(--accent-mid)',
            boxShadow: isJudgeLocked ? '0 0 0 3px rgba(190,18,60,0.15)' : '0 0 0 3px var(--accent-lt)',
            transition: 'background .3s, box-shadow .3s',
          }} />
          <button
            onClick={toggleLock}
            disabled={lockLoading}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all"
            style={{
              background: lockLoading ? 'var(--surface2)' : isJudgeLocked ? '#be123c' : 'var(--surface)',
              color: lockLoading ? 'var(--text3)' : isJudgeLocked ? '#fff' : 'var(--text2)',
              boxShadow: isJudgeLocked ? '0 2px 8px rgba(190,18,60,0.2)' : 'var(--shadow-sm)',
              border: isJudgeLocked ? 'none' : '1px solid var(--border)',
              cursor: lockLoading ? 'not-allowed' : 'pointer',
              transition: 'all .2s',
              fontFamily: 'inherit',
            }}
          >
            {lockLoading
              ? <Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
              : isJudgeLocked
                ? <Lock size={13} />
                : <Unlock size={13} />
            }
            {lockLoading
              ? 'SAVING…'
              : isJudgeLocked
                ? 'JUDGES LOCKED'
                : 'LOCK JUDGES'
            }
          </button>
        </div>
      </div>

      {/* Lock status feedback */}
      {lockError && (
        <div style={{
          background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10,
          padding: '10px 14px', fontSize: 12, color: '#dc2626',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertTriangle size={13} />
          Failed to save: {lockError}
        </div>
      )}

      {/* Live status pill */}
      <div style={{
        background: isJudgeLocked ? '#fff1f2' : 'var(--accent-lt)',
        border: `1px solid ${isJudgeLocked ? '#fecdd3' : 'var(--accent-bd)'}`,
        borderRadius: 10,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 12,
        fontWeight: 600,
        color: isJudgeLocked ? '#dc2626' : 'var(--accent)',
        transition: 'all .3s',
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: isJudgeLocked ? '#ef4444' : 'var(--accent-mid)',
          animation: 'pulse 2s infinite',
        }} />
        {isJudgeLocked
          ? 'Judges are currently LOCKED — scoring is disabled on the judge portal. Changes take effect immediately.'
          : 'Judges are UNLOCKED — scoring is active on the judge portal. Toggle to lock instantly.'
        }
      </div>

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
          {[
            { id: 'average', title: 'By Average', desc: 'Standard percentage-based average. Highest score wins.' },
            { id: 'rank', title: 'By Place (Rank-Sum)', desc: 'Rank points summed from all judges. Lowest sum wins.' },
          ].map(opt => {
            const active = calculationType === opt.id;
            return (
              <div key={opt.id} onClick={() => setCalculationType(opt.id)} style={{ flex: 1, padding: 16, borderRadius: 12, cursor: 'pointer', transition: 'all .2s', border: `2px solid ${active ? 'var(--accent-mid)' : 'var(--border)'}`, background: active ? 'var(--accent-lt)' : 'var(--surface2)', boxShadow: active ? '0 0 0 3px var(--accent-lt)' : 'none' }}>
                <div style={{ fontWeight: 800, color: active ? 'var(--accent)' : 'var(--text1)', fontSize: 14 }}>{opt.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{opt.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

// ─── CONTESTANTS ──────────────────────────────────────────────────────────────

const ContestantsSection = ({ contestants, setContestants, newName, setNewName, addContestant }) => (
  <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div className="flex items-center justify-between">
      <div className="section-heading" style={{ margin: 0 }}>Contestants</div>
      <span className="badge badge-indigo">{contestants.length} registered</span>
    </div>
    <div className="flex flex-col gap-2">
      {contestants.map(c => (
        <div key={c.id} className="flex items-center gap-3 transition-all" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-bd)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{c.number}</div>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text1)' }}>{c.name}</div>
          <button className="btn-danger" onClick={() => setContestants(contestants.filter(x => x.id !== c.id))}>✕</button>
        </div>
      ))}
      {contestants.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>No contestants registered yet.</div>
      )}
    </div>
    <div style={{ background: 'var(--surface2)', border: '1.5px dashed var(--accent-bd)', borderRadius: 10, padding: 16 }}>
      <div className="field-label">Add Contestant</div>
      <div className="flex gap-2 mt-1">
        <input className="field-input" placeholder="Full name…" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addContestant()} />
        <button className="btn-primary" onClick={addContestant}>+ Add</button>
      </div>
    </div>
  </div>
);

// ─── LOGO UPLOAD FIELD ────────────────────────────────────────────────────────

const LogoUploadField = ({ label, value, onChange }) => {
  const inputRef = useRef();
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 300;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      onChange(canvas.toDataURL('image/jpeg', 0.75));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };
  return (
    <div>
      <div className="field-label">{label}</div>
      <div onClick={() => inputRef.current.click()} style={{ border: '2px dashed var(--accent-bd)', borderRadius: 10, padding: '20px 16px', cursor: 'pointer', background: value ? 'var(--accent-lt)' : 'var(--surface2)', display: 'flex', alignItems: 'center', gap: 12, transition: 'all .2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-mid)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--accent-bd)'; }}>
        {value ? (
          <>
            <img src={value} alt={label} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
            <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>✓ Uploaded</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Click to replace</div></div>
          </>
        ) : (
          <>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
              <Upload size={18} style={{ color: 'var(--text3)' }} />
            </div>
            <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Click to upload</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>PNG, JPG, SVG — stored as base64</div></div>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
};

// ─── SYSTEM CONFIG ────────────────────────────────────────────────────────────

const SystemConfigSection = ({
  schoolName, setSchoolName, portalName, setPortalName,
  schoolLogo, setSchoolLogo, backgroundLogo, setBackgroundLogo,
  primaryColor, setPrimaryColor, secondaryColor, setSecondaryColor,
  footerText, setFooterText, logoRadius, setLogoRadius,
}) => {
  const [saveStatus, setSaveStatus] = React.useState('idle');
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMsg('');
    try {
      const data = await apiClient.post('/save-system-config', {
        school_name: schoolName, portal_name: portalName,
        school_logo: schoolLogo, background_logo: backgroundLogo,
        primary_color: primaryColor, secondary_color: secondaryColor,
        footer_text: footerText, logo_radius: logoRadius,
      });
      if (!data.success) throw new Error(data.error || 'Save failed');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setErrorMsg(err.message);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  const primary   = primaryColor   || '#006c49';
  const secondary = secondaryColor || '#10b981';
  const r         = logoRadius >= 999 ? '50%' : `${logoRadius}px`;

  const radiusPresets = [
    { label: 'Square', value: 0 }, { label: 'Rounded', value: 8 },
    { label: 'Pill', value: 16 }, { label: 'Circle', value: 999 },
  ];

  return (
    <div className="panel p-6 flex flex-col gap-6">
      <div className="section-heading" style={{ margin: 0 }}>System Configuration</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><div className="field-label">School Name</div><input className="field-input" placeholder="e.g. Harvard University" value={schoolName} onChange={e => setSchoolName(e.target.value)} /></div>
        <div><div className="field-label">Portal Name</div><input className="field-input" placeholder="e.g. Veridict" value={portalName} onChange={e => setPortalName(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LogoUploadField label="School Logo" value={schoolLogo} onChange={setSchoolLogo} />
        <LogoUploadField label="Background Logo" value={backgroundLogo} onChange={setBackgroundLogo} />
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="flex items-center justify-between">
          <div className="field-label" style={{ margin: 0 }}>Logo Border Radius</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-lt)', padding: '2px 10px', borderRadius: 6 }}>
            {logoRadius >= 999 ? '50% (circle)' : `${logoRadius}px`}
          </span>
        </div>
        <input type="range" min={0} max={999} step={1} value={logoRadius} onChange={e => setLogoRadius(Number(e.target.value))} style={{ width: '100%', accentColor: primary, cursor: 'pointer' }} />
        <div className="flex gap-2 flex-wrap">
          {radiusPresets.map(p => (
            <button key={p.label} onClick={() => setLogoRadius(p.value)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', border: `1.5px solid ${logoRadius === p.value ? 'var(--accent-mid)' : 'var(--border)'}`, background: logoRadius === p.value ? 'var(--accent-lt)' : 'var(--surface2)', color: logoRadius === p.value ? 'var(--accent)' : 'var(--text2)' }}>
              {p.label}
            </button>
          ))}
        </div>
        {schoolLogo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src={schoolLogo} alt="preview" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: r, border: '2px solid var(--accent-bd)', transition: 'border-radius .2s' }} />
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Live preview of your logo shape</div>
          </div>
        ) : (
          <div style={{ width: 56, height: 56, background: 'var(--accent-lt)', border: '2px dashed var(--accent-bd)', borderRadius: r, transition: 'border-radius .2s' }} />
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="field-label">Primary Color</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: 42, height: 42, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', cursor: 'pointer' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text2)' }}>{primaryColor}</span>
          </div>
        </div>
        <div>
          <div className="field-label">Secondary Color</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} style={{ width: 42, height: 42, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', cursor: 'pointer' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text2)' }}>{secondaryColor}</span>
          </div>
        </div>
      </div>
      <div><div className="field-label">Footer Text</div><input className="field-input" placeholder="e.g. Powered by Veridict" value={footerText} onChange={e => setFooterText(e.target.value)} /></div>
      <div>
        <div className="field-label" style={{ marginBottom: 10 }}>Live Preview</div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ background: primary, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {schoolLogo ? (
                <img src={schoolLogo} alt="logo" style={{ width: 34, height: 34, borderRadius: r, objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.4)', transition: 'border-radius .2s' }} />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: r, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.3)' }}>
                  <Activity size={14} style={{ color: '#fff' }} />
                </div>
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', lineHeight: 1.2 }}>{portalName || 'Veridict'}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{schoolName || 'Judge Portal'}</div>
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '2px 10px', borderRadius: 999, marginBottom: 2 }}>Live Judging Session</span>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Sample Contest Name</div>
            </div>
            <select style={{ appearance: 'none', padding: '6px 24px 6px 10px', background: 'rgba(255,255,255,0.95)', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#191c1e', fontFamily: 'inherit' }}>
              <option>Select Judge</option><option>Judge 1</option><option>Judge 2</option>
            </select>
          </div>
          <div style={{ height: 3, background: `linear-gradient(90deg, rgba(255,255,255,0.3), ${secondary}, rgba(255,255,255,0.3))` }} />
          <div style={{ background: primary, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {schoolLogo && <img src={schoolLogo} alt="logo" style={{ width: 26, height: 26, objectFit: 'cover', borderRadius: r, border: '1.5px solid rgba(255,255,255,0.4)', transition: 'border-radius .2s' }} />}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{portalName || 'Veridict'}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{schoolName || ''}</div>
              </div>
            </div>
            {footerText && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 500, textAlign: 'center' }}>{footerText}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#fff', fontWeight: 600 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: secondary }} />
              Encrypted · Secure Session
            </div>
          </div>
        </div>
      </div>
      <button onClick={handleSave} disabled={saveStatus === 'saving'} style={{ padding: '10px 28px', background: saveStatus === 'saving' ? 'var(--surface2)' : primary, color: saveStatus === 'saving' ? 'var(--text3)' : '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start', transition: 'all .2s' }}>
        {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'success' ? 'Saved!' : 'Save Configuration'}
      </button>
      {saveStatus === 'error' && <div style={{ fontSize: 12, color: '#dc2626' }}>{errorMsg}</div>}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─── MAIN RENDER ──────────────────────────────────────────────────────────────

const SectionRender = ({
  activeNav,
  contestName, setContestName,
  contestType, setContestType,
  aiPrompt, setAiPrompt,
  judgeCount, setJudgeCount,
  calculationType, setCalculationType,
  // NOTE: isJudgeLocked / setIsJudgeLocked no longer needed here — context handles it
  criteria, setCriteria,
  contestants, setContestants,
  newCrit, setNewCrit,
  newWeight, setNewWeight,
  newName, setNewName,
  totalWeight,
  setShowDeleteModal,
  schoolName, setSchoolName,
  portalName, setPortalName,
  schoolLogo, setSchoolLogo,
  backgroundLogo, setBackgroundLogo,
  primaryColor, setPrimaryColor,
  secondaryColor, setSecondaryColor,
  footerText, setFooterText,
  logoRadius, setLogoRadius,
}) => {
  // still need isJudgeLocked for the Overview badge — pull from context
  const { isJudgeLocked } = useContestContext();

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
      {activeNav === 'overview' && (
        <OverviewSection
          contestants={contestants} judgeCount={judgeCount} criteria={criteria}
          totalWeight={totalWeight} contestName={contestName} contestType={contestType}
          calculationType={calculationType} aiPrompt={aiPrompt} isJudgeLocked={isJudgeLocked}
          setShowDeleteModal={setShowDeleteModal}
          schoolLogo={schoolLogo} backgroundLogo={backgroundLogo}
          schoolName={schoolName} portalName={portalName} logoRadius={logoRadius}
        />
      )}
      {activeNav === 'contest' && (
        <ContestInfoSection contestName={contestName} setContestName={setContestName} contestType={contestType} setContestType={setContestType} />
      )}
      {activeNav === 'ai' && (
        <AIConfigSection aiPrompt={aiPrompt} setAiPrompt={setAiPrompt} />
      )}
      {activeNav === 'criteria' && (
        <CriteriaManager criteria={criteria} setCriteria={setCriteria} newCrit={newCrit} setNewCrit={setNewCrit} addCriterion={addCriterion} />
      )}
      {activeNav === 'judges' && (
        // ↓ isJudgeLocked and setIsJudgeLocked are GONE — JudgesSection uses context internally
        <JudgesSection
          judgeCount={judgeCount} setJudgeCount={setJudgeCount}
          calculationType={calculationType} setCalculationType={setCalculationType}
        />
      )}
      {activeNav === 'contestants' && (
        <ContestantsSection contestants={contestants} setContestants={setContestants} newName={newName} setNewName={setNewName} addContestant={addContestant} />
      )}
      {activeNav === 'system' && (
        <SystemConfigSection
          schoolName={schoolName} setSchoolName={setSchoolName}
          portalName={portalName} setPortalName={setPortalName}
          schoolLogo={schoolLogo} setSchoolLogo={setSchoolLogo}
          backgroundLogo={backgroundLogo} setBackgroundLogo={setBackgroundLogo}
          primaryColor={primaryColor} setPrimaryColor={setPrimaryColor}
          secondaryColor={secondaryColor} setSecondaryColor={setSecondaryColor}
          footerText={footerText} setFooterText={setFooterText}
          logoRadius={logoRadius} setLogoRadius={setLogoRadius}
        />
      )}
    </>
  );
};

export default SectionRender;