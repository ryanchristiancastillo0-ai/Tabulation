import React, { useState, useEffect, useRef } from 'react';
import {
  Trash2, Lock, Unlock, Upload, CheckCircle, AlertCircle, Loader,
  Users, Scale, ListChecks, PieChart, LayoutDashboard, Trophy,
  Tag, Calculator, Sparkles, ShieldCheck, AlertTriangle,
  Building2, Star, Activity, Palette, LayoutTemplate, SlidersHorizontal,
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

const JudgesSection = ({ judgeCount, setJudgeCount, calculationType, setCalculationType }) => {
  const { isJudgeLocked, toggleLock, lockLoading, lockError } = useContestContext();

  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div className="flex items-center justify-between">
        <div className="section-heading" style={{ margin: 0 }}>Judge & Calculation Configuration</div>
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
            {lockLoading ? 'SAVING…' : isJudgeLocked ? 'JUDGES LOCKED' : 'LOCK JUDGES'}
          </button>
        </div>
      </div>

      {lockError && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={13} />
          Failed to save: {lockError}
        </div>
      )}

      <div style={{
        background: isJudgeLocked ? '#fff1f2' : 'var(--accent-lt)',
        border: `1px solid ${isJudgeLocked ? '#fecdd3' : 'var(--accent-bd)'}`,
        borderRadius: 10, padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 12, fontWeight: 600,
        color: isJudgeLocked ? '#dc2626' : 'var(--accent)',
        transition: 'all .3s',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isJudgeLocked ? '#ef4444' : 'var(--accent-mid)', animation: 'pulse 2s infinite' }} />
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

// ─── HEADER TEMPLATES ─────────────────────────────────────────────────────────

const HEADER_TEMPLATES = [
  // ── Template 1: Structured — two-row, logo left, select judge prominent right ──
  {
    id: 'structured',
    name: 'Structured',
    desc: 'Two-row layout — branding top, contest info & judge selector bottom',
    icon: <LayoutTemplate size={18} />,
    render: ({ primary, secondary, schoolLogo, portalName, schoolName, footerText, logoRadius }) => {
      const r = logoRadius >= 999 ? '50%' : `${logoRadius}px`;
      return (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', fontFamily: 'inherit' }}>
          {/* Row 1 — branding bar */}
          <div style={{ background: primary, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            {schoolLogo ? (
              <img src={schoolLogo} alt="logo" style={{ width: 34, height: 34, borderRadius: r, objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.35)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 34, height: 34, borderRadius: r, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.25)' }}>
                <Building2 size={15} style={{ color: '#fff' }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', lineHeight: 1.2 }}>{portalName || 'Veridict'}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{schoolName || 'Official Judging Portal'}</div>
            </div>
            {/* Live badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: secondary, display: 'inline-block' }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.1em' }}>LIVE</span>
            </div>
          </div>
          {/* Accent rule */}
          <div style={{ height: 2, background: secondary }} />
          {/* Row 2 — contest + judge selector */}
          <div style={{ background: 'var(--surface)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 2 }}>Active Contest</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>Sample Contest Name 2025</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)' }}>Judging As</div>
              <select style={{ appearance: 'none', padding: '6px 28px 6px 12px', background: primary, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(255,255,255,0.7)'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 28 }}>
                <option>Select Judge…</option>
                <option>Judge 1</option>
                <option>Judge 2</option>
                <option>Judge 3</option>
              </select>
            </div>
          </div>
          {/* Footer */}
          {footerText && (
            <div style={{ background: 'var(--surface2)', padding: '5px 20px', fontSize: 10, color: 'var(--text3)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>{footerText}</div>
          )}
        </div>
      );
    },
  },

  // ── Template 2: Compact — single solid bar, logo + title center, judge right ──
  {
    id: 'compact',
    name: 'Compact Bar',
    desc: 'Single-row header — identity left, contest center, judge selector right',
    icon: <SlidersHorizontal size={18} />,
    render: ({ primary, secondary, schoolLogo, portalName, schoolName, footerText, logoRadius }) => {
      const r = logoRadius >= 999 ? '50%' : `${logoRadius}px`;
      return (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', fontFamily: 'inherit' }}>
          {/* Single main bar */}
          <div style={{ background: primary, padding: '0 20px', minHeight: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Left — logo + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 16, borderRight: '1px solid rgba(255,255,255,0.18)', flexShrink: 0 }}>
              {schoolLogo ? (
                <img src={schoolLogo} alt="logo" style={{ width: 32, height: 32, borderRadius: r, objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.3)' }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: r, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.2)' }}>
                  <Building2 size={13} style={{ color: '#fff' }} />
                </div>
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: 12, color: '#fff', lineHeight: 1.1 }}>{portalName || 'Veridict'}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{schoolName || 'Judge Portal'}</div>
              </div>
            </div>
            {/* Center — contest title */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Now Judging</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Sample Contest Name 2025</div>
            </div>
            {/* Right — judge selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16, borderLeft: '1px solid rgba(255,255,255,0.18)', flexShrink: 0 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: secondary, flexShrink: 0 }} />
              <select style={{ appearance: 'none', padding: '7px 30px 7px 12px', background: 'rgba(255,255,255,0.14)', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(255,255,255,0.6)'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                <option style={{ background: primary, color: '#fff' }}>Select Judge…</option>
                <option style={{ background: primary, color: '#fff' }}>Judge 1</option>
                <option style={{ background: primary, color: '#fff' }}>Judge 2</option>
              </select>
            </div>
          </div>
          {/* Bottom accent + footer */}
          <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${secondary}, transparent)` }} />
          {footerText && (
            <div style={{ background: 'var(--surface2)', padding: '5px 20px', fontSize: 10, color: 'var(--text3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{footerText}</span>
              <span style={{ color: 'var(--text3)', opacity: 0.6 }}>Encrypted · Secure Session</span>
            </div>
          )}
        </div>
      );
    },
  },

  // ── Template 3: Elevated — white card header with colored accent left border, judge dropdown prominent ──
  {
    id: 'elevated',
    name: 'Elevated Card',
    desc: 'White card style — colored left accent, contest & judge info clearly separated',
    icon: <Palette size={18} />,
    render: ({ primary, secondary, schoolLogo, portalName, schoolName, footerText, logoRadius }) => {
      const r = logoRadius >= 999 ? '50%' : `${logoRadius}px`;
      return (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', fontFamily: 'inherit' }}>
          {/* Colored top strip */}
          <div style={{ height: 4, background: primary }} />
          {/* Main white card */}
          <div style={{ background: 'var(--surface)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Logo */}
            <div style={{ flexShrink: 0, padding: '6px', background: `${primary}12`, borderRadius: logoRadius >= 999 ? '50%' : `${Math.min((logoRadius || 0) + 4, 16)}px`, border: `1.5px solid ${primary}30` }}>
              {schoolLogo ? (
                <img src={schoolLogo} alt="logo" style={{ width: 36, height: 36, borderRadius: r, objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: r, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={16} style={{ color: primary }} />
                </div>
              )}
            </div>
            {/* Identity */}
            <div style={{ borderRight: '1px solid var(--border)', paddingRight: 16, flexShrink: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text1)', lineHeight: 1.2 }}>{portalName || 'Veridict'}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{schoolName || 'Official Judging Portal'}</div>
            </div>
            {/* Contest info */}
            <div style={{ flex: 1, paddingLeft: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 3 }}>Active Contest</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>Sample Contest Name 2025</div>
            </div>
            {/* Judge selector — most prominent element */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)' }}>Judging As</div>
              <select style={{ appearance: 'none', padding: '8px 32px 8px 14px', background: primary, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 2px 10px ${primary}40`, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(255,255,255,0.75)'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                <option>Select Judge…</option>
                <option>Judge 1</option>
                <option>Judge 2</option>
                <option>Judge 3</option>
              </select>
            </div>
          </div>
          {/* Footer */}
          {footerText && (
            <div style={{ background: 'var(--surface2)', padding: '6px 20px', fontSize: 10, color: 'var(--text3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
              <span>{footerText}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: secondary, display: 'inline-block' }} />
                Secure Session
              </span>
            </div>
          )}
        </div>
      );
    },
  },
];

// ─── SYSTEM CONFIG ────────────────────────────────────────────────────────────

const SystemConfigSection = ({
  schoolName, setSchoolName, portalName, setPortalName,
  schoolLogo, setSchoolLogo, backgroundLogo, setBackgroundLogo,
  primaryColor, setPrimaryColor, secondaryColor, setSecondaryColor,
  footerText, setFooterText, logoRadius, setLogoRadius,
  // header template — optional; component owns local state so clicking always works
  headerTemplate: headerTemplateProp,
  setHeaderTemplate: setHeaderTemplateProp,
}) => {

  const [configTab, setConfigTab] = React.useState('branding');

   

  // Self-contained local state — selection works even if parent hasn't wired the prop
  const [localTemplate, setLocalTemplate] = React.useState(headerTemplateProp || 'structured');
  React.useEffect(() => {
    if (headerTemplateProp && headerTemplateProp !== localTemplate) setLocalTemplate(headerTemplateProp);
  }, [headerTemplateProp]);
  const headerTemplate = localTemplate;
  const setHeaderTemplate = (id) => {
    setLocalTemplate(id);
    if (typeof setHeaderTemplateProp === 'function') setHeaderTemplateProp(id);
  };

  // Add this useEffect inside SystemConfigSection, after the existing localTemplate state
useEffect(() => {
  const fetchSaved = async () => {
    try {
      const schoolId = (() => {
        try {
          const p = new URLSearchParams(window.location.search);
          if (p.get('school_id')) return p.get('school_id');
          const u = localStorage.getItem('adminUser');
          if (u) return JSON.parse(u)?.school_id || 1;
        } catch { return 1; }
        return 1;
      })();
      const res = await fetch(`${API_BASE}/public/system-config?school_id=${schoolId}`);
      const data = await res.json();
      if (data?.header_template) {
        setLocalTemplate(data.header_template);
        if (typeof setHeaderTemplateProp === 'function') setHeaderTemplateProp(data.header_template);
      }
    } catch (err) {
      console.warn('Could not load saved header template:', err);
    }
  };
  fetchSaved();
}, []); // runs once on mount

 

  const primary   = primaryColor   || '#006c49';
  const secondary = secondaryColor || '#10b981';
  const r         = logoRadius >= 999 ? '50%' : `${logoRadius}px`;

  const radiusPresets = [
    { label: 'Square', value: 0 }, { label: 'Rounded', value: 8 },
    { label: 'Pill', value: 16 }, { label: 'Circle', value: 999 },
  ];

  const tabs = [
    { id: 'branding', label: 'Branding & Colors', icon: <Palette size={14} /> },
    { id: 'header', label: 'Header Template', icon: <LayoutTemplate size={14} /> },
  ];

  const activeTemplate = HEADER_TEMPLATES.find(t => t.id === (headerTemplate || 'structured')) || HEADER_TEMPLATES[0];

  return (
    <div className="panel p-6 flex flex-col gap-6">
      <div className="section-heading" style={{ margin: 0 }}>System Configuration</div>

      {/* ── Tab switcher ── */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: 4 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setConfigTab(tab.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '9px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit', transition: 'all .18s',
              background: configTab === tab.id ? 'var(--surface)' : 'transparent',
              color: configTab === tab.id ? 'var(--accent)' : 'var(--text3)',
              boxShadow: configTab === tab.id ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: BRANDING & COLORS (original section)
      ══════════════════════════════════════════════════════ */}
      {configTab === 'branding' && (
        <>
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
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: HEADER TEMPLATE (NEW)
      ══════════════════════════════════════════════════════ */}
      {configTab === 'header' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Info banner */}
          <div style={{ background: 'var(--accent-lt)', border: '1px solid var(--accent-bd)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--accent)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <LayoutTemplate size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>Choose a <strong>header layout</strong> for the judge portal. It uses your branding colors and logo automatically — configure those in the Branding tab.</div>
          </div>

          {/* Template cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {HEADER_TEMPLATES.map(tpl => {
              const isActive = headerTemplate === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setHeaderTemplate(tpl.id)}
                  style={{
                    border: `2px solid ${isActive ? 'var(--accent-mid)' : 'var(--border)'}`,
                    borderRadius: 14,
                    padding: 14,
                    cursor: 'pointer',
                    transition: 'all .18s',
                    background: isActive ? 'var(--accent-lt)' : 'var(--surface2)',
                    boxShadow: isActive ? '0 0 0 3px var(--accent-lt)' : 'none',
                  }}
                >
                  {/* Card header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9,
                      background: isActive ? 'var(--accent)' : 'var(--surface)',
                      border: `1px solid ${isActive ? 'var(--accent-bd)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isActive ? '#fff' : 'var(--text3)',
                      flexShrink: 0,
                    }}>
                      {tpl.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: isActive ? 'var(--accent)' : 'var(--text1)' }}>{tpl.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{tpl.desc}</div>
                    </div>
                    {isActive && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                        <CheckCircle size={11} /> Selected
                      </div>
                    )}
                  </div>

                  {/* Live template preview */}
                  <div style={{ pointerEvents: 'none' }}>
                    {tpl.render({ primary, secondary, schoolLogo, portalName, schoolName, footerText, logoRadius })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom / Override note */}
          <div style={{ border: '1px dashed var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <SlidersHorizontal size={14} style={{ color: 'var(--text3)', marginTop: 1, flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              Templates inherit your <strong style={{ color: 'var(--text2)' }}>primary color</strong>, <strong style={{ color: 'var(--text2)' }}>logo</strong>, and <strong style={{ color: 'var(--text2)' }}>footer text</strong> automatically. Adjust those in the <strong style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => setConfigTab('branding')}>Branding tab</strong> and the preview updates live.
            </div>
          </div>
        </div>
      )}

      {/* ── Live preview (always visible, reflects active template) ── */}
<div>
  <div className="field-label" style={{ marginBottom: 10 }}>
    Live Preview — <span style={{ fontWeight: 500, color: 'var(--text3)' }}>{activeTemplate.name}</span>
  </div>

  {/* Header preview */}
  {activeTemplate.render({ primary, secondary, schoolLogo, portalName, schoolName, footerText, logoRadius })}

  {/* Footer preview */}
  <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
    <div style={{ background: primary, padding: '20px 24px' }}>
      {/* Top section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
            {portalName || 'Veridict'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4, maxWidth: 280, lineHeight: 1.5 }}>
            Professional judging and tabulation platform for Catholic schools and academic institutions in the Philippines.
          </div>
        </div>
        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px' }}>
          <div style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: secondary, opacity: 0.5, animation: 'pulse 2s infinite' }} />
            <div style={{ position: 'absolute', inset: 2, borderRadius: '50%', background: secondary }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Secure System Active</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>Encrypted judging session</div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '0 0 14px' }} />

      {/* Bottom row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          © {new Date().getFullYear()} {schoolName || 'Veridict'}. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          {['Privacy', 'Security', 'Support'].map(link => (
            <span key={link} style={{ cursor: 'pointer' }}>{link}</span>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>

  
    
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
  // NEW: header template props (wire up in parent: const [headerTemplate, setHeaderTemplate] = useState('structured'))
  headerTemplate, setHeaderTemplate,
}) => {
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
          headerTemplate={headerTemplate} setHeaderTemplate={setHeaderTemplate}
        />
      )}
    </>
  );
};

export default SectionRender;