import { useState, useCallback, useRef, useMemo } from 'react';
import { getMedalStyleFS } from './index';
import { FiDownload, FiX, FiSave, FiSliders } from 'react-icons/fi';
import { GiTrophy } from 'react-icons/gi';
import { RiMedalLine } from 'react-icons/ri';
import { HiOutlineSparkles } from 'react-icons/hi';
import { BsCircleFill } from 'react-icons/bs';

const MEDAL_ICONS = [
  <GiTrophy className="text-amber-400" size={22} />,
  <RiMedalLine className="text-slate-300" size={22} />,
  <RiMedalLine className="text-orange-400" size={22} />,
];
const MEDAL_LABEL = ['1st', '2nd', '3rd'];

// Podium display order (left → right) and relative stage height per rank
const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd
const PODIUM_HEIGHT = { 0: 132, 1: 92, 2: 68 };

const CONFETTI_COLORS = ['#F59E0B', '#EF4444', '#22C55E', '#3B82F6', '#EC4899', '#A855F7'];

function useDebounced(fn, delay = 120) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn]);
}

function ColorField({ label, value, onChange }) {
  const [local, setLocal] = useState(value);
  const debounced = useDebounced(onChange);

  const handleChange = (e) => {
    setLocal(e.target.value);
    debounced(e.target.value);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={local}
          onChange={handleChange}
          className="w-8 h-8 rounded-sm cursor-pointer border-0 bg-transparent"
        />
        <span className="text-xs font-mono text-white/50">{local}</span>
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
        className="bg-white/10 border border-white/15 text-white text-xs font-medium px-3 py-2 rounded-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 w-full"
      />
    </div>
  );
}

/**
 * Pure CSS confetti burst — a handful of small rectangles that fall + spin
 * from the top of the podium area. No external library required.
 */
function Confetti({ active }) {
  const pieces = useMemo(() => {
    return Array.from({ length: 45 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 2.6 + Math.random() * 1.6,
      size: 6 + Math.random() * 6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.random() * 360,
      drift: (Math.random() - 0.5) * 120,
    }));
  }, []);

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translate(0, -20px) rotate(0deg); opacity: 0; }
          8%   { opacity: 1; }
          100% { transform: translate(var(--drift), 340px) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            borderRadius: 1,
            '--drift': `${p.drift}px`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Podium "stage" — three raised blocks (2nd / 1st / 3rd) with an avatar
 * initial, name, and score floating above each block, and a large rank
 * number carved into the block itself.
 */
function Podium({ standings, isRankMode, accentColor, textColor, confettiOn }) {
  return (
    <div className="relative max-w-2xl mx-auto w-full mb-10">
      <Confetti active={confettiOn} />
      <div className="flex items-end justify-center gap-3 sm:gap-5 w-full">
        {PODIUM_ORDER.map((podiumIdx) => {
          const c = standings[podiumIdx];
          if (!c) return null;
          const isFirst = podiumIdx === 0;
          const initial = c.name?.trim()?.[0]?.toUpperCase() || '?';
          const value = isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2);

          return (
            <div key={c.name} className="flex flex-col items-center flex-1 max-w-[150px]">
              {/* Avatar */}
              <div
                className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-base sm:text-lg mb-2 border-2 shrink-0"
                style={{
                  background: isFirst ? accentColor : 'rgba(255,255,255,0.1)',
                  borderColor: isFirst ? accentColor : 'rgba(255,255,255,0.2)',
                  color: isFirst ? '#0a0a0a' : textColor,
                }}
              >
                {isFirst && (
                  <span className="absolute -top-6 text-lg">👑</span>
                )}
                {initial}
              </div>

              {/* Name */}
              <span
                className="text-xs sm:text-sm font-bold text-center truncate w-full mb-1.5"
                style={{ color: textColor }}
              >
                {c.name}
              </span>

              {/* Score pill */}
              <span
                className="text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full mb-3"
                style={{
                  background: isFirst ? `${accentColor}30` : 'rgba(255,255,255,0.08)',
                  color: isFirst ? accentColor : textColor,
                  opacity: isFirst ? 1 : 0.75,
                }}
              >
                {isRankMode ? `Rank ${value}` : `${value}`}
              </span>

              {/* Stage block */}
              <div
                className="w-full rounded-t-sm flex items-start justify-center pt-3 transition-all duration-500"
                style={{
                  height: PODIUM_HEIGHT[podiumIdx],
                  background: isFirst
                    ? `linear-gradient(180deg, ${accentColor}45, ${accentColor}15)`
                    : 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))',
                  borderTop: `2px solid ${isFirst ? accentColor : 'rgba(255,255,255,0.18)'}`,
                  borderLeft: '1px solid rgba(255,255,255,0.08)',
                  borderRight: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span
                  className="text-3xl sm:text-4xl font-black"
                  style={{ color: isFirst ? accentColor : textColor, opacity: isFirst ? 1 : 0.5 }}
                >
                  {podiumIdx + 1}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FullscreenView({
  data, standings, isRankMode, onExit, onExportCSV,
  fsConfig, onFsConfigChange, onSave, isSaving, isSaved,
}) {
  const [showPanel, setShowPanel] = useState(false);
  const [confettiOn, setConfettiOn] = useState(true);

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
        <div className="relative z-10 mx-4 sm:mx-10 lg:mx-16 mt-4 rounded-sm border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p
              className="text-[11px] font-black tracking-[0.15em] uppercase"
              style={{ color: textColor, opacity: 0.5 }}
            >
              Customize Display
            </p>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 text-xs font-black tracking-widest uppercase px-4 py-2 rounded-sm border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:  isSaved ? 'rgba(34,197,94,0.2)' : `${accentColor}30`,
                borderColor: isSaved ? 'rgba(34,197,94,0.4)' : `${accentColor}50`,
                color:       isSaved ? '#40916C' : textColor,
              }}
            >
              {isSaving ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Saving...
                </>
              ) : isSaved ? (
                <>
                  <FiSave size={13} /> Saved
                </>
              ) : (
                <>
                  <FiSave size={13} /> Save
                </>
              )}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <ColorField
              label="Background"
              value={bgColor}
              onChange={v => update('bgColor', v)}
            />
            <ColorField
              label="Accent"
              value={accentColor}
              onChange={v => update('accentColor', v)}
            />
            <ColorField
              label="Text"
              value={textColor}
              onChange={v => update('textColor', v)}
            />
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
              className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-full mb-3"
              style={{ background: `${accentColor}30`, color: textColor, opacity: 0.7 }}
            >
              <HiOutlineSparkles size={11} />
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
              onClick={() => setConfettiOn(v => !v)}
              className="flex items-center gap-2 border text-xs font-bold px-4 py-2.5 rounded-sm transition-all hover:brightness-110"
              style={{
                background:  confettiOn ? `${accentColor}25` : 'rgba(255,255,255,0.06)',
                borderColor: confettiOn ? `${accentColor}50` : 'rgba(255,255,255,0.15)',
                color:       textColor,
              }}
              title={confettiOn ? 'Turn confetti off' : 'Turn confetti on'}
            >
              🎉 Confetti {confettiOn ? 'On' : 'Off'}
            </button>
            <button
              onClick={() => setShowPanel(p => !p)}
              className="flex items-center gap-2 border text-xs font-bold px-4 py-2.5 rounded-sm transition-all hover:brightness-110"
              style={{
                background:  `${accentColor}25`,
                borderColor: `${accentColor}50`,
                color:       textColor,
              }}
            >
              <FiSliders size={13} />
              {showPanel ? 'Hide' : 'Customize'}
            </button>
            <button
              onClick={onExportCSV}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold px-4 py-2.5 rounded-sm transition-all"
              style={{ color: textColor }}
            >
              <FiDownload size={13} />
              Export CSV
            </button>
            <button
              onClick={onExit}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold px-4 py-2.5 rounded-sm transition-all"
              style={{ color: textColor }}
            >
              <FiX size={13} />
              Exit
            </button>
          </div>
        </div>

        {/* Top 3 Podium / Stage */}
        {standings.length >= 3 && (
          <Podium
            standings={standings}
            isRankMode={isRankMode}
            accentColor={accentColor}
            textColor={textColor}
            confettiOn={confettiOn}
          />
        )}

        {/* Full Rankings Table */}
        <div
          className="rounded-sm border overflow-hidden backdrop-blur-sm"
          style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
        >
          <div
            className="px-5 sm:px-7 py-4 border-b flex items-center gap-2"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <BsCircleFill
              size={6}
              style={{ color: accentColor, animation: 'pulse 2s infinite' }}
            />
            <span
              className="text-[11px] font-bold tracking-[0.15em] uppercase"
              style={{ color: textColor, opacity: 0.4 }}
            >
              Full Rankings
            </span>
          </div>

          {standings.length === 0 ? (
            <div
              className="py-16 text-center text-sm"
              style={{ color: textColor, opacity: 0.3 }}
            >
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
                      className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-sm flex items-center justify-center text-sm sm:text-base font-black"
                      style={medalStyle}
                    >
                      {isTop
                        ? <div style={{ filter: 'brightness(1.2)' }}>{MEDAL_ICONS[idx]}</div>
                        : <span className="text-sm font-black">{idx + 1}</span>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="font-bold truncate text-sm sm:text-base"
                        style={{ color: idx === 0 ? accentColor : textColor }}
                      >
                        {c.name}
                      </p>
                      {isTop && (
                        <p
                          className="text-[10px] font-semibold uppercase tracking-wider mt-0.5"
                          style={{ color: textColor, opacity: 0.3 }}
                        >
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
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wider mt-0.5"
                        style={{ color: textColor, opacity: 0.25 }}
                      >
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
          <BsCircleFill size={6} style={{ color: accentColor }} />
          <span
            className="text-[11px] font-bold tracking-[0.15em] uppercase"
            style={{ color: textColor }}
          >
            Veridict · Live Results
          </span>
        </div>

      </div>
    </div>
  );
}