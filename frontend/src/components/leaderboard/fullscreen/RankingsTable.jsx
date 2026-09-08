import { BsCircleFill } from 'react-icons/bs';
import getMedalStyleFS from '../getMedalStyleFS';
import { MEDAL_ICONS, MEDAL_LABEL } from './constants.jsx';

export default function RankingsTable({ standings, isRankMode, accentColor, textColor }) {
  return (
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
  );
}