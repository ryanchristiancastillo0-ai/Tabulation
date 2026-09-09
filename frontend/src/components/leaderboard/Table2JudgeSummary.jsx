import {useEffect} from 'react'
import {SectionLabel,ExportMenu,getMedalClass,getOrdinal} from './index'
import { formatRank } from '../../utils/ranks'
export default function Table2JudgeSummary({ standings, judgeIds, isRankMode, judgeCount, getJudgeScore, getJudgeRank, onCSV, onPNG }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <SectionLabel number="02" label="Judge Summary Table" />
        <ExportMenu onCSV={onCSV} onPNG={onPNG} />
      </div>
      <p className="text-[10px] sm:text-xs text-[var(--text3)] mb-3 -mt-1">
        {isRankMode
          ? "Shows each judge's raw score total and the rank they give each contestant."
          : "Shows each judge's score total. Final column is the average across all judges."}
      </p>

      <div id="table-summary" className="overflow-x-auto bg-[var(--surface)] border border-[var(--border)] rounded-sm">
        {/* FIX: min-width scales with number of judges so it never squishes */}
        <table className="w-full text-xs sm:text-sm" style={{ minWidth: Math.max(380, 180 + judgeIds.length * 120) }}>
          <thead className="bg-[var(--accent)] text-white">
            <tr>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-center w-12 sm:w-16 text-[10px] uppercase tracking-wider font-semibold">Place</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[10px] uppercase tracking-wider font-semibold">Contestant</th>

              {/* FIX: use judgeId (actual DB value) not array index */}
              {judgeIds.map((judgeId) => (
                <th key={judgeId} className="px-3 sm:px-4 py-2.5 sm:py-3 text-center text-[10px] uppercase tracking-wider font-semibold min-w-[90px] sm:min-w-[110px]">
                  <div>Judge {judgeId}</div>
                  <div className="text-[9px] font-normal text-[var(--text3)] normal-case tracking-normal">
                    {isRankMode ? 'Score / Rank' : 'Score'}
                  </div>
                </th>
              ))}

              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right text-[10px] uppercase tracking-wider font-semibold bg-[var(--surface2)] min-w-[90px] sm:min-w-[110px]">
                <div>{isRankMode ? 'Rank Sum' : 'Final Avg'}</div>
                <div className="text-[9px] font-normal text-[var(--text3)] normal-case tracking-normal">
                  {isRankMode ? 'lower = better' : 'higher = better'}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.length === 0 ? (
              <tr>
                <td colSpan={3 + judgeIds.length} className="px-4 py-8 text-center text-[var(--text3)] italic text-sm">
                  No scores submitted yet.
                </td>
              </tr>
            ) : standings.map((c, idx) => (
              <tr
                key={c.name}
                className={`border-b border-[var(--border)] transition-colors ${idx === 0 ? 'bg-[var(--amber-lt)] hover:bg-[var(--amber-lt)]' : 'hover:bg-[var(--accent-lt)]'}`}
              >
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-sm sm:rounded-sm flex items-center justify-center font-bold text-[10px] sm:text-xs mx-auto ${getMedalClass(idx)}`}>
                    {formatRank(c.rank ?? idx + 1)}
                  </div>
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-bold text-[var(--text1)] text-xs sm:text-sm">{c.name}</td>

                {/* FIX: use judgeId (actual DB value) */}
                {judgeIds.map((judgeId) => {
                  const score   = getJudgeScore(c.name, judgeId);
                  const rankPos = getJudgeRank(c.name, judgeId);
                  return (
                    <td key={judgeId} className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                      {score !== null ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-mono font-bold text-[var(--text1)] text-xs sm:text-sm">{score.toFixed(2)}</span>
                          {isRankMode && (
                            <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${rankPos === 1 ? 'bg-[var(--amber-lt)] text-[var(--amber)]' : 'bg-[var(--accent-lt)] text-[var(--accent)]'}`}>
                              {formatRank(rankPos)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--text3)] font-mono text-xs">—</span>
                      )}
                    </td>
                  );
                })}

                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-mono font-bold text-[var(--accent-mid)] bg-[var(--surface2)] text-xs sm:text-sm">
                  {isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
