import { useState } from 'react';
import { FiDownload, FiX, FiSliders } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi';
import { BsCircleFill } from 'react-icons/bs';
import Podium from './Podium';
import CustomizePanel from './CustomizePanel';
import RankingsTable from './RankingsTable';

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

      <CustomizePanel
        showPanel={showPanel}
        bgColor={bgColor}
        accentColor={accentColor}
        textColor={textColor}
        titleText={titleText}
        subtitleText={subtitleText}
        contestPlaceholder={data.settings?.contest_name}
        onChange={update}
        onSave={onSave}
        isSaving={isSaving}
        isSaved={isSaved}
      />

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
        <RankingsTable
          standings={standings}
          isRankMode={isRankMode}
          accentColor={accentColor}
          textColor={textColor}
        />

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