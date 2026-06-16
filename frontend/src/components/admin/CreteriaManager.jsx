import React, { useState } from 'react';
import { Trash2, Plus, Edit3, LayoutGrid, Crown, Mic2, MessageSquare, BookOpen, Trophy, Zap, Star, Heart, Target, Award, Brain, Music, Flame, Shield, X, Smile, Users, Globe, Camera, Paintbrush, Lightbulb, Clock, TrendingUp, ThumbsUp, Eye, Dumbbell, Wind, Leaf, Feather, Layers, Compass, BarChart2 } from 'lucide-react';

const PRESETS = [
  {
    label: 'Pageant',
    icon: Crown,
    criteria: [
      { name: 'Beauty', weight: 25 },
      { name: 'Intelligence', weight: 25 },
      { name: 'Poise & Bearing', weight: 20 },
      { name: 'Talent', weight: 15 },
      { name: 'Swimwear / Attire', weight: 15 },
    ],
  },
  {
    label: 'Talent Show',
    icon: Mic2,
    criteria: [
      { name: 'Performance Quality', weight: 35 },
      { name: 'Stage Presence', weight: 25 },
      { name: 'Originality', weight: 20 },
      { name: 'Technical Skill', weight: 20 },
    ],
  },
  {
    label: 'Debate',
    icon: MessageSquare,
    criteria: [
      { name: 'Argumentation', weight: 30 },
      { name: 'Rebuttal', weight: 25 },
      { name: 'Delivery & Clarity', weight: 25 },
      { name: 'Research & Evidence', weight: 20 },
    ],
  },
  {
    label: 'Academic',
    icon: BookOpen,
    criteria: [
      { name: 'Content Accuracy', weight: 35 },
      { name: 'Critical Thinking', weight: 30 },
      { name: 'Presentation', weight: 20 },
      { name: 'Creativity', weight: 15 },
    ],
  },
  {
    label: 'Sports',
    icon: Trophy,
    criteria: [
      { name: 'Skill & Technique', weight: 40 },
      { name: 'Sportsmanship', weight: 20 },
      { name: 'Speed & Agility', weight: 25 },
      { name: 'Strategy', weight: 15 },
    ],
  },
];

const SINGLE_SUGGESTIONS = [
  { name: 'Performance',      icon: Flame,       weight: 20 },
  { name: 'Creativity',       icon: Star,        weight: 15 },
  { name: 'Confidence',       icon: Zap,         weight: 15 },
  { name: 'Personality',      icon: Heart,       weight: 10 },
  { name: 'Accuracy',         icon: Target,      weight: 20 },
  { name: 'Leadership',       icon: Award,       weight: 15 },
  { name: 'Intelligence',     icon: Brain,       weight: 20 },
  { name: 'Musicality',       icon: Music,       weight: 20 },
  { name: 'Discipline',       icon: Shield,      weight: 15 },
  { name: 'Stage Presence',   icon: Mic2,        weight: 15 },
  { name: 'Charisma',         icon: Smile,       weight: 15 },
  { name: 'Teamwork',         icon: Users,       weight: 15 },
  { name: 'Cultural Fit',     icon: Globe,       weight: 10 },
  { name: 'Photogenics',      icon: Camera,      weight: 10 },
  { name: 'Artistry',         icon: Paintbrush,  weight: 20 },
  { name: 'Innovation',       icon: Lightbulb,   weight: 20 },
  { name: 'Time Management',  icon: Clock,       weight: 10 },
  { name: 'Improvement',      icon: TrendingUp,  weight: 10 },
  { name: 'Crowd Appeal',     icon: ThumbsUp,    weight: 15 },
  { name: 'Showmanship',      icon: Eye,         weight: 15 },
  { name: 'Athleticism',      icon: Dumbbell,    weight: 20 },
  { name: 'Composure',        icon: Wind,        weight: 10 },
  { name: 'Sustainability',   icon: Leaf,        weight: 10 },
  { name: 'Eloquence',        icon: Feather,     weight: 15 },
  { name: 'Depth',            icon: Layers,      weight: 15 },
  { name: 'Adaptability',     icon: Compass,     weight: 15 },
  { name: 'Data Usage',       icon: BarChart2,   weight: 10 },
  { name: 'Sportsmanship',    icon: Trophy,      weight: 10 },
];

export default function CriteriaManager({
  criteria,
  setCriteria,
  newCrit,
  setNewCrit,
  addCriterion,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [activePreset, setActivePreset] = useState(null);

  const totalWeight = criteria.reduce((s, c) => s + Number(c.weight || 0), 0);
  const isComplete = totalWeight === 100;

  const handleInternalAdd = () => {
    if (!newCrit.trim()) return;
    addCriterion();
    setIsAdding(false);
  };

  const applyPreset = (preset) => {
    setActivePreset(preset.label);
    setCriteria(
      preset.criteria.map((c, i) => ({
        id: `preset-${Date.now()}-${i}`,
        name: c.name,
        weight: c.weight,
      }))
    );
  };

  const addSingle = (suggestion) => {
    const remaining = 100 - totalWeight;
    if (remaining <= 0) return;
    const weight = Math.min(suggestion.weight, remaining);
    setCriteria(prev => [
      ...prev,
      { id: `single-${Date.now()}`, name: suggestion.name, weight },
    ]);
    setActivePreset(null);
  };

  // Remove a suggestion-added criterion by name
  const removeSingle = (e, name) => {
    e.stopPropagation();
    setCriteria(prev => prev.filter(c => c.name.toLowerCase() !== name.toLowerCase()));
  };

  const updateField = (id, field, val) => {
    if (field === 'weight') {
      const numericVal = Math.max(0, Number(val) || 0);
      const otherTotal = criteria
        .filter((c) => c.id != id)
        .reduce((s, c) => s + Number(c.weight || 0), 0);
      if (otherTotal + numericVal > 100) return;
      val = numericVal;
    }
    setCriteria(criteria.map((c) => (c.id == id ? { ...c, [field]: val } : c)));
  };

  const removeCriteria = (id) => {
    setCriteria(criteria.filter((c) => c.id != id));
  };

  const alreadyAdded = (name) =>
    criteria.some(c => c.name.toLowerCase() === name.toLowerCase());

  return (
    <div
      className="overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* ── Preset Bundles ── */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--accent-lt)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <LayoutGrid size={12} /> Quick start — full presets
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRESETS.map((preset) => {
            const isActive = activePreset === preset.label;
            const Icon = preset.icon;
            return (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                  fontFamily: 'inherit', cursor: 'pointer', transition: 'all .15s',
                  border: `1.5px solid ${isActive ? 'var(--accent-mid)' : 'var(--accent-bd)'}`,
                  background: isActive ? 'var(--accent)' : 'var(--surface)',
                  color: isActive ? '#fff' : 'var(--accent)',
                  boxShadow: isActive ? '0 2px 8px rgba(0,108,73,0.2)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }
                }}
                onMouseLeave={e => {
                  if (!isActive) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--accent)'; }
                }}
              >
                <Icon size={12} />
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Preview pills */}
        {activePreset && (
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: 'var(--surface)', border: '1px solid var(--accent-bd)',
            display: 'flex', flexWrap: 'wrap', gap: 6,
          }}>
            {PRESETS.find(p => p.label === activePreset)?.criteria.map((c, i) => (
              <span key={i} style={{
                fontSize: 11, padding: '2px 10px', borderRadius: 999,
                background: 'var(--accent-lt)', color: 'var(--accent)',
                border: '1px solid var(--accent-bd)', fontWeight: 600,
              }}>
                {c.name} — {c.weight}%
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Individual Suggestions ── */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface2)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text3)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Plus size={12} /> Add individual criteria
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SINGLE_SUGGESTIONS.map((s) => {
            const Icon = s.icon;
            const added = alreadyAdded(s.name);
            const full = totalWeight >= 100;
            const disabled = full && !added;

            return (
              <button
                key={s.name}
                onClick={() => {
                  if (added) {
                    // clicking an added chip removes it
                    setCriteria(prev =>
                      prev.filter(c => c.name.toLowerCase() !== s.name.toLowerCase())
                    );
                  } else if (!disabled) {
                    addSingle(s);
                  }
                }}
                title={
                  added
                    ? `Remove ${s.name}`
                    : full
                    ? 'Weight is at 100%'
                    : `Add ${s.name} (${s.weight}%)`
                }
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: added ? '5px 8px 5px 12px' : '5px 12px',
                  borderRadius: 999, fontSize: 12, fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all .15s',
                  border: `1px solid ${added ? 'var(--accent-bd)' : 'var(--border)'}`,
                  background: added ? 'var(--accent-lt)' : 'var(--surface)',
                  color: added ? 'var(--accent)' : full ? 'var(--text3)' : 'var(--text2)',
                  opacity: disabled ? 0.4 : 1,
                }}
                onMouseEnter={e => {
                  if (!disabled && !added) {
                    e.currentTarget.style.borderColor = 'var(--accent-bd)';
                    e.currentTarget.style.color = 'var(--accent)';
                    e.currentTarget.style.background = 'var(--accent-lt)';
                  }
                  if (added) {
                    e.currentTarget.style.background = '#fee2e2';
                    e.currentTarget.style.borderColor = '#fca5a5';
                    e.currentTarget.style.color = '#b91c1c';
                  }
                }}
                onMouseLeave={e => {
                  if (!disabled && !added) {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text2)';
                    e.currentTarget.style.background = 'var(--surface)';
                  }
                  if (added) {
                    e.currentTarget.style.background = 'var(--accent-lt)';
                    e.currentTarget.style.borderColor = 'var(--accent-bd)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }
                }}
              >
                <Icon size={11} />
                {s.name}
                {added ? (
                  /* X remove icon */
                  <span
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 14, height: 14, borderRadius: '50%',
                      background: 'rgba(0,108,73,0.15)',
                      marginLeft: 2, flexShrink: 0,
                    }}
                  >
                    <X size={9} strokeWidth={2.5} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Header & Progress ── */}
      <div
        className="p-6"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-lt)', color: 'var(--accent)', border: '1px solid var(--accent-bd)' }}
            >
              <LayoutGrid size={16} />
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text1)' }}>Scoring Matrix</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
                Weight Distribution
              </div>
            </div>
          </div>

          <div className="text-right">
            <span
              className="text-xl font-bold"
              style={{ color: isComplete ? 'var(--accent)' : 'var(--text1)', fontFamily: 'var(--font-mono)' }}
            >
              {totalWeight}%
            </span>
            <div className="h-1 w-24 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(totalWeight, 100)}%`,
                  background: isComplete ? 'var(--accent-mid)' : 'var(--accent)',
                }}
              />
            </div>
          </div>
        </div>

        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all"
            style={{ border: '1.5px dashed var(--accent-bd)', color: 'var(--accent)', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-lt)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Plus size={13} /> Add Custom Criterion
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              placeholder="Criterion name…"
              value={newCrit}
              onChange={e => setNewCrit(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInternalAdd()}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text1)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent-mid)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-lt)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
            <button
              onClick={handleInternalAdd}
              className="px-4 py-2 rounded-lg font-bold text-xs text-white transition-all"
              style={{ background: 'var(--accent)', boxShadow: '0 2px 8px rgba(0,108,73,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-mid)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
            >
              Add
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ color: 'var(--text3)', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ── List ── */}
      <div className="p-4 space-y-2">
        {criteria.length === 0 && !isAdding && (
          <div className="py-10 text-center text-xs font-medium italic" style={{ color: 'var(--text3)' }}>
            No criteria yet — pick a preset or add individually above.
          </div>
        )}

        {criteria.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-4 p-3 rounded-xl transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-bd)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div className="flex-1 flex items-center gap-2">
              <Edit3 size={12} style={{ color: 'var(--text3)', flexShrink: 0 }} />
              <input
                type="text"
                value={c.name}
                onChange={e => updateField(c.id, 'name', e.target.value)}
                className="bg-transparent border-none p-0 w-full outline-none text-sm font-semibold"
                style={{ color: 'var(--text1)' }}
              />
            </div>

            <div className="flex items-center gap-2 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>
              <input
                type="number"
                value={c.weight || ''}
                onChange={e => updateField(c.id, 'weight', e.target.value)}
                className="w-14 py-1 px-2 rounded-lg border text-right text-sm font-bold outline-none transition-all"
                style={{ border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--accent)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent-mid)'; e.target.style.boxShadow = '0 0 0 2px var(--accent-lt)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
              <span className="text-xs font-bold" style={{ color: 'var(--text3)' }}>%</span>
              <button
                onClick={() => removeCriteria(c.id)}
                className="ml-1 p-1.5 rounded-lg transition-all"
                style={{ color: 'var(--text3)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#be123c'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)'; }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer status ── */}
      <div
        className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest"
        style={{
          background: isComplete ? 'var(--accent-lt)' : 'var(--surface2)',
          color: isComplete ? 'var(--accent)' : 'var(--text3)',
          borderTop: '1px solid var(--border)',
        }}
      >
        {isComplete ? '✓ Configuration Valid' : `${100 - totalWeight}% remaining to assign`}
      </div>
    </div>
  );
}