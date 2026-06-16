import { useState } from 'react';
import { getMedalStyleFS } from './index';

const MEDAL_EMOJI = ['🥇', '🥈', '🥉'];
const MEDAL_LABEL = ['1st', '2nd', '3rd'];

function ColorField({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
        />
        <span className="text-xs font-mono text-white/50">{value}</span>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white/10 border border-white/15 text-white text-xs font-medium px-3 py-2 rounded-lg placeholder:text-white/25 focus:outline-none focus:border-white/30 w-full"
      />
    </div>
  );
}

export default function FullscreenView({
  data, standings, isRankMode, onExit, onExportCSV,
  fsConfig, onFsConfigChange, onSave, isSaving, isSaved,
}) {
  const [showPanel, setShowPanel] = useState(false);

  const { bgColor, accentColor, textColor, titleText, subtitleText } = fsConfig;

  const update = (key, val) => onFsConfigChange(prev => ({ ...prev, [key]: val }));

  const resolvedTitle    = titleText    || data.settings?.contest_name || 'Competition Results';
  const resolvedSubtitle = subtitleText || `${isRankMode ? 'Rank-Based Scoring' : 'Average-Based Scoring'} · Live Results`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto font-['Inter',sans-serif]"
      style={{ background: bgColor }}
    >
      {/* Background accent blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
          style={{ background: accentColor }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
          style={{ background: accentColor }}
        />
      </div>

      {/* Customize Panel */}
      {showPanel && (
        <div className="relative z-10 mx-4 sm:mx-10 lg:mx-16 mt-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-black tracking-[0.15em] uppercase" style={{ color: textColor, opacity: 0.5 }}>
              Customize Display
            </p>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 text-xs font-black tracking-widest uppercase px-4 py-2 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:   isSaved ? 'rgba(34,197,94,0.2)' : `${accentColor}30`,
                borderColor:  isSaved ? 'rgba(34,197,94,0.4)' : `${accentColor}50`,
                color:        isSaved ? '#22c55e' : textColor,
              }}
            >
              {isSaving ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Saving...
                </>
              ) : isSaved ? (
                <>✓ Saved</>
              ) : (
                <>💾 Save</>
              )}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <ColorField label="Background"  value={bgColor}     onChange={v => update('bgColor', v)} />
            <ColorField label="Accent"      value={accentColor} onChange={v => update('accentColor', v)} />
            <ColorField label="Text"        value={textColor}   onChange={v => update('textColor', v)} />
            <TextField
              label="Title Override"
              value={titleText}
              onChange={v => update('titleText', v)}
              placeholder={data.settings?.contest_name || 'Contest name'}
            />
            <TextField
              label="Subtitle Override"
              value={subtitleText}
              onChange={v => update('subtitleText', v)}
              placeholder="Subtitle text"
            />
          </div>
        </div>
      )}

      <div className="relative flex flex-col flex-1 px-4 sm:px-10 lg:px-16 py-8 sm:py-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
          <div>
            <span
              className="inline-block text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-full mb-3"
              style={{ background: `${accentColor}30`, color: textColor, opacity: 0.7 }}
            >
              Official Final Standings
            </span>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight"
              style={{ color: textColor }}
            >
              {resolvedTitle}
            </h1>
            <p className="text-sm font-medium mt-2" style={{ color: textColor, opacity: 0.4 }}>
              {resolvedSubtitle}
            </p>
          </div>

          <div className="flex gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setShowPanel(p => !p)}
              className="flex items-center gap-2 border text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
              style={{ background: `${accentColor}25`, borderColor: `${accentColor}50`, color: textColor }}
            >
              🎨 {showPanel ? 'Hide' : 'Customize'}
            </button>
            <button
              onClick={onExportCSV}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
              style={{ color: textColor }}
            >
              ↓ Export CSV
            </button>
            <button
              onClick={onExit}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
              style={{ color: textColor }}
            >
              ✕ Exit
            </button>
          </div>
        </div>

        {/* Top 3 Podium */}
        {standings.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 max-w-2xl mx-auto w-full">
            {[1, 0, 2].map((podiumIdx) => {
              const c = standings[podiumIdx];
              if (!c) return null;
              const isFirst = podiumIdx === 0;
              return (
                <div
                  key={c.name}
                  className={`flex flex-col items-center gap-2 rounded-2xl p-4 sm:p-5 border transition-all ${isFirst ? 'scale-105' : ''}`}
                  style={{
                    background:  isFirst ? `${accentColor}25` : 'rgba(255,255,255,0.05)',
                    borderColor: isFirst ? `${accentColor}50` : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <span className="text-2xl sm:text-3xl">{MEDAL_EMOJI[podiumIdx]}</span>
                  <span
                    className="text-[10px] font-black tracking-widest uppercase"
                    style={{ color: isFirst ? accentColor : textColor, opacity: isFirst ? 1 : 0.4 }}
                  >
                    {MEDAL_LABEL[podiumIdx]}
                  </span>
                  <span className="font-bold text-center text-xs sm:text-sm leading-tight" style={{ color: textColor }}>
                    {c.name}
                  </span>
                  <span
                    className="text-lg sm:text-xl font-black font-mono"
                    style={{ color: isFirst ? accentColor : textColor }}
                  >
                    {isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Rankings Table */}
        <div
          className="rounded-2xl border overflow-hidden backdrop-blur-sm"
          style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
        >
          <div
            className="px-5 sm:px-7 py-4 border-b flex items-center gap-2"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor, animation: 'pulse 2s infinite' }} />
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: textColor, opacity: 0.4 }}>
              Full Rankings
            </span>
          </div>

          {standings.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: textColor, opacity: 0.3 }}>
              No scores submitted yet.
            </div>
          ) : (
            <div>
              {standings.map((c, idx) => {
                const medalStyle = getMedalStyleFS(idx);
                const isTop      = idx < 3;
                return (
                  <div
                    key={c.name}
                    className="flex items-center gap-4 px-5 sm:px-7 py-4 sm:py-5 transition-all"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      background:   idx === 0 ? `${accentColor}15` : 'transparent',
                    }}
                  >
                    <div
                      className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-sm sm:text-base font-black"
                      style={medalStyle}
                    >
                      {isTop ? MEDAL_EMOJI[idx] : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="font-bold truncate text-sm sm:text-base"
                        style={{ color: idx === 0 ? accentColor : textColor }}
                      >
                        {c.name}
                      </p>
                      {isTop && (
                        <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: textColor, opacity: 0.3 }}>
                          {MEDAL_LABEL[idx]}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className="text-lg sm:text-2xl font-black font-mono"
                        style={{ color: idx === 0 ? accentColor : textColor }}
                      >
                        {isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2)}
                      </span>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: textColor, opacity: 0.25 }}>
                        {isRankMode ? 'rank sum' : 'avg score'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 flex items-center gap-2 opacity-30">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: textColor }}>
            Veridict · Live Results
          </span>
        </div>

      </div>
    </div>
  );
}