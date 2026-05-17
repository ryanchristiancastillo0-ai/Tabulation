import React, { useState, useEffect, useRef } from 'react';
import {
  Trash2, 
  Users, Scale, ListChecks, PieChart, LayoutDashboard, Trophy,
  Tag, Calculator, Sparkles, ShieldCheck, AlertTriangle,
  Building2, Star, 
  
} from 'lucide-react';
import { card } from './card.js'
const OverviewSection = ({
  contestants, judgeCount, criteria, totalWeight,
  contestName, contestType, calculationType, aiPrompt,
  isJudgeLocked, setShowDeleteModal,
  schoolLogo, backgroundLogo, schoolName, portalName,
  logoRadius,
}) => (
  <div className="flex flex-col gap-4 sm:gap-6">

    {(schoolLogo || portalName || schoolName) && (
      <div style={{
        ...card,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'linear-gradient(135deg, var(--accent-lt), var(--surface))',
        position: 'relative', overflow: 'hidden',
      }}>
        {backgroundLogo && (
          <img src={backgroundLogo} alt="bg" style={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            width: 64, height: 64, objectFit: 'contain', opacity: 0.10,
          }} />
        )}
        {schoolLogo ? (
          <img src={schoolLogo} alt="school logo" style={{
            width: 46, height: 46,
            borderRadius: logoRadius >= 999 ? '50%' : `${logoRadius}px`,
            objectFit: 'cover', border: '2px solid var(--accent-bd)',
            flexShrink: 0,
          }} />
        ) : (
          <div style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            background: 'var(--accent-lt)', border: '1.5px solid var(--accent-bd)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={20} style={{ color: 'var(--accent)' }} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {portalName || 'Your Portal'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            {schoolName || 'Your School'}
          </div>
        </div>
      </div>
    )}

    {/* Stats grid — 2 col on mobile, 4 on md+ */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}
      className="md:grid-cols-4"
    >
      {[
        { label: 'Contestants', value: contestants.length, color: 'var(--accent)', bg: 'var(--accent-lt)', border: 'var(--accent-bd)', icon: <Users size={16} /> },
        { label: 'Judges', value: judgeCount, color: 'var(--accent-mid)', bg: 'var(--accent-lt)', border: 'var(--accent-bd)', icon: <Scale size={16} /> },
        { label: 'Criteria', value: criteria.length, color: 'var(--amber)', bg: '#fffbeb', border: '#fde68a', icon: <ListChecks size={16} /> },
        {
          label: 'Weight Total', value: `${totalWeight}%`,
          color: totalWeight === 100 ? 'var(--accent-mid)' : 'var(--red)',
          bg: totalWeight === 100 ? 'var(--accent-lt)' : '#fff1f2',
          border: totalWeight === 100 ? 'var(--accent-bd)' : '#fecdd3',
          icon: <PieChart size={16} />,
        },
      ].map(s => (
        <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#fff', border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
            {s.icon}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>

    {/* Quick Summary */}
    <div style={card}>
      <div className="flex items-center gap-2 mb-4">
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-lt)', border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LayoutDashboard size={14} style={{ color: 'var(--accent)' }} />
        </div>
        <span className="section-heading" style={{ margin: 0 }}>Quick Summary</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
        {[
          { label: 'Contest', icon: <Trophy size={12} />, value: contestName ? <span style={{ color: 'var(--text1)', fontWeight: 600 }}>{contestName}</span> : <em style={{ color: 'var(--text3)' }}>Not set</em> },
          { label: 'Type', icon: <Tag size={12} />, value: <span className="badge badge-indigo" style={{ textTransform: 'capitalize' }}>{contestType}</span> },
          { label: 'Calculation', icon: <Calculator size={12} />, value: <span className="badge badge-indigo">{calculationType === 'average' ? 'Average Score' : 'Rank-Sum (By Place)'}</span> },
          { label: 'Weight', icon: <PieChart size={12} />, value: <span className={`badge ${totalWeight === 100 ? 'badge-green' : 'badge-red'}`}>{totalWeight}% {totalWeight === 100 ? '✓ Valid' : '✗ Must be 100%'}</span> },
          { label: 'AI Prompt', icon: <Sparkles size={12} />, value: <span style={{ color: aiPrompt ? 'var(--accent-mid)' : 'var(--red)', fontWeight: 600, fontSize: 12 }}>{aiPrompt ? '✓ Configured' : '✗ Not set'}</span> },
          { label: 'Judge Access', icon: <ShieldCheck size={12} />, value: <span className={`badge ${isJudgeLocked ? 'badge-red' : 'badge-green'}`}>{isJudgeLocked ? 'Locked' : 'Open'}</span> },
        ].map(({ label, icon, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text3)', fontWeight: 600, minWidth: 100, fontSize: 12 }}>
              <span style={{ opacity: 0.7 }}>{icon}</span>
              {label}
            </div>
            <div style={{ marginLeft: 'auto' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Danger Zone */}
    <div style={{ ...card, border: '1px solid #fecdd3', background: '#fff1f2', padding: '16px 20px' }}>
      <div className="flex items-center gap-2 mb-3">
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ffe4e6', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={14} style={{ color: '#be123c' }} />
        </div>
        <span className="section-heading" style={{ margin: 0, color: '#9f1239' }}>Danger Zone</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9f1239' }}>Reset Competition Data</div>
          <div style={{ fontSize: 12, color: '#be123c', marginTop: 3 }}>Clear all scores, criteria, and contestants for a new event.</div>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: '#be123c', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#9f1239'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#be123c'; }}
        >
          <Trash2 size={14} /> Reset Data
        </button>
      </div>
    </div>

    {/* Scoring Criteria list */}
    <div style={card}>
      <div className="flex items-center gap-2 mb-4">
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-lt)', border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ListChecks size={14} style={{ color: 'var(--accent)' }} />
        </div>
        <span className="section-heading" style={{ margin: 0 }}>Scoring Criteria</span>
        <span className="badge badge-indigo" style={{ marginLeft: 'auto' }}>{criteria.length} criteria</span>
      </div>
      <div className="flex flex-col gap-2">
        {criteria.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent-lt)', border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Star size={12} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text1)', minWidth: 80 }}>{c.name}</div>
            <div style={{ flex: 2, margin: '0 6px', minWidth: 60 }}>
              <div className="weight-bar-track">
                <div className="weight-bar-fill" style={{ width: `${Math.min(c.weight ?? c.percentage ?? 0, 100)}%` }} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent)', minWidth: 36, textAlign: 'right' }}>
              {c.weight ?? c.percentage ?? 0}%
            </div>
          </div>
        ))}
        {criteria.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '28px 0', color: 'var(--text3)' }}>
            <ListChecks size={26} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: 13, fontStyle: 'italic' }}>No criteria added yet.</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default OverviewSection