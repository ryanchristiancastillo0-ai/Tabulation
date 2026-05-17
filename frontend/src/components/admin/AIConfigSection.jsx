import React, { useState, useEffect } from "react";

import { card } from './card.js'
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
      <div style={{ background: 'var(--accent-lt)', border: '1px solid var(--accent-bd)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'var(--accent)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>✦</span>
        <div>This prompt tells the AI how to <strong>generate the Judge UI and Tabulation layout</strong>. Pick a theme preset or write your own below.</div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10 }}>Design theme presets</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
          {THEME_PRESETS.map(theme => {
            const isActive = activeTheme === theme.name;
            return (
              <button key={theme.name} onClick={() => selectTheme(theme)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: '10px 12px', borderRadius: 12, textAlign: 'left', border: isActive ? '2px solid var(--accent-mid)' : '1px solid var(--border)', background: isActive ? 'var(--accent-lt)' : 'var(--surface2)', cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit', boxShadow: isActive ? '0 0 0 3px var(--accent-lt)' : 'none' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {theme.swatches.map((color, i) => (
                    <div key={i} style={{ width: 13, height: 13, borderRadius: 3, background: color, border: color === '#ffffff' || color === '#fdf8f0' ? '1px solid var(--border)' : 'none' }} />
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
        <textarea className="field-input" style={{ minHeight: 120 }} placeholder='Or write your own: "Design a Judge UI with..."' value={aiPrompt} onChange={e => { setAiPrompt(e.target.value); setActiveTheme(null); }} />
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
export default AIConfigSection