import React from "react";
import DefaultJudgeUIPreview from './DefaultJudgeUIPreview.jsx';

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

const AI_MODELS = [
  {
    id: 'qwen3.8-flash',
    label: 'Qwen3.8-Flash — Fast',
    desc: 'Best for fast UI generation and everyday coding tasks. Recommended when you want results quickly.',
    hint: '⚡ Fast generation — Recommended for quickly creating judge UI.',
  },
  {
    id: 'mimo-v2.5',
    label: 'MiMo-V2.5 — Deep Reasoning',
    desc: 'Best for complex prompts, difficult UI requirements, and tasks that need deeper reasoning. May take longer to generate.',
    hint: '🧠 Deep reasoning — Better for complex requirements, but generation may take longer.',
  },
  {
    id: 'glm-5.3-flash',
    label: 'GLM-5.3-Flash — Fast + Powerful',
    desc: 'Good balance of speed and reasoning for UI generation and coding tasks.',
    hint: '⚡ Strong + fast — Good balance between generation speed and reasoning.',
  },
];

const MODE_OPTIONS = [
  { id: 'ai',      label: 'AI Prompt',      desc: 'AI designs the judge scoring UI from your prompt.' },
  { id: 'default', label: 'Default UI',     desc: 'Standard built-in scoring table — no AI used.' },
];

const AIConfigSection = ({ aiPrompt, setAiPrompt, aiModel, setAiModel, uiMode, setUiMode, contestants, criteria, contestName }) => {
  const [activeTheme, setActiveTheme] = React.useState(null);
  const selectTheme = (theme) => { setActiveTheme(theme.name); setAiPrompt(theme.prompt); };
  const appendTag = (tag) => { setAiPrompt(prev => prev.trim() ? `${prev.trim()}. ${tag}.` : `${tag}.`); };
  const selectedModel = AI_MODELS.find((m) => m.id === aiModel) || AI_MODELS[0];
  const isDefault = uiMode === 'default';

  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-heading">Judge UI Configuration</div>

      {/* Mode selector */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10 }}>Judge UI Mode</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
          {MODE_OPTIONS.map(mode => {
            const isActive = uiMode === mode.id;
            return (
              <button key={mode.id} onClick={() => setUiMode(mode.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5, padding: '12px 14px', borderRadius: 6, textAlign: 'left', border: isActive ? '2px solid var(--accent-mid)' : '1px solid var(--border)', background: isActive ? 'var(--accent-lt)' : 'var(--surface2)', cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit', boxShadow: isActive ? '0 0 0 3px var(--accent-lt)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: isActive ? 'var(--accent)' : 'var(--text3)', flexShrink: 0 }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? 'var(--accent)' : 'var(--text1)' }}>{mode.label}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>{mode.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {isDefault ? (
        <>
          <div style={{ background: 'var(--accent-lt)', border: '1px solid var(--accent-bd)', borderRadius: 6, padding: '12px 14px', fontSize: 13, color: 'var(--accent)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>✦</span>
            <div>Judges get the <strong>standard scoring table</strong> instantly — dropdowns for each criterion, automatic totals and ranks. No AI generation, no waiting, fully offline-safe.</div>
          </div>
          <DefaultJudgeUIPreview contestants={contestants} criteria={criteria} contestName={contestName} />
        </>
      ) : (
        <>
          <div style={{ background: 'var(--accent-lt)', border: '1px solid var(--accent-bd)', borderRadius: 6, padding: '12px 14px', fontSize: 13, color: 'var(--accent)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>✦</span>
            <div>This prompt tells the AI how to <strong>generate the Judge UI and Tabulation layout</strong>. Pick a theme preset or write your own below.</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10 }}>AI Model</div>
            <select
              className="field-input"
              title="Choose which B.AI model generates the Judge UI"
              style={{ appearance: 'none', cursor: 'pointer' }}
              value={selectedModel.id}
              onChange={e => setAiModel(e.target.value)}
            >
              {AI_MODELS.map((m) => (
                <option key={m.id} value={m.id} title={m.desc}>{m.label}</option>
              ))}
            </select>
            <div style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', marginTop: 8, lineHeight: 1.5 }}>
              {selectedModel.desc}
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>{selectedModel.hint}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10 }}>Design theme presets</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
              {THEME_PRESETS.map(theme => {
                const isActive = activeTheme === theme.name;
                return (
                  <button key={theme.name} onClick={() => selectTheme(theme)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: '10px 12px', borderRadius: 6, textAlign: 'left', border: isActive ? '2px solid var(--accent-mid)' : '1px solid var(--border)', background: isActive ? 'var(--accent-lt)' : 'var(--surface2)', cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit', boxShadow: isActive ? '0 0 0 3px var(--accent-lt)' : 'none' }}>
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
        </>
      )}
    </div>
  );
};
export default AIConfigSection