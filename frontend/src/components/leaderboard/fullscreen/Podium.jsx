import Confetti from './Confetti';
import StageBlock from './StageBlock';
import { PODIUM_ORDER, PODIUM_HEIGHT, STAGE_DEPTH } from './constants.jsx';

/**
 * Podium "stage" — three raised blocks (2nd / 1st / 3rd) with an avatar
 * initial, name, and score floating above each block, and a large rank
 * number carved into the block itself. Blocks render as pseudo-3D cuboids.
 */
export default function Podium({ standings, isRankMode, accentColor, textColor, confettiOn }) {
  return (
    <div className="relative max-w-2xl mx-auto w-full mb-10">
      <Confetti active={confettiOn} />
      <div
        className="flex items-end justify-center gap-3 sm:gap-5 w-full"
        style={{ paddingRight: STAGE_DEPTH }}
      >
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

              {/* 3D stage block */}
              <StageBlock
                height={PODIUM_HEIGHT[podiumIdx]}
                isFirst={isFirst}
                accentColor={accentColor}
                textColor={textColor}
                rank={podiumIdx + 1}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}