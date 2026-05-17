import {useEffect} from 'react'
import {SectionLabel,ExportMenu,getMedalClass} from './index'
export default function Table2JudgeSummary({ standings, judgeIds, isRankMode, judgeCount, getJudgeScore, getJudgeRank, onCSV, onPNG }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <SectionLabel number="02" label="Judge Summary Table" />
        <ExportMenu onCSV={onCSV} onPNG={onPNG} />
      </div>
      <p className="text-[10px] sm:text-xs text-[#9ca3af] mb-3 -mt-1">
        {isRankMode
          ? "Shows each judge's raw score total and the rank they give each contestant."
          : "Shows each judge's score total. Final column is the average across all judges."}
      </p>

      <div id="table-summary" className="overflow-x-auto bg-white border border-[#bbcabf] rounded-xl">
        {/* FIX: min-width scales with number of judges so it never squishes */}
        <table className="w-full text-xs sm:text-sm" style={{ minWidth: Math.max(380, 180 + judgeIds.length * 120) }}>
          <thead className="bg-[#191c1e] text-white">
            <tr>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-center w-12 sm:w-16 text-[10px] uppercase tracking-wider font-semibold">Place</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[10px] uppercase tracking-wider font-semibold">Contestant</th>

              {/* FIX: use judgeId (actual DB value) not array index */}
              {judgeIds.map((judgeId) => (
                <th key={judgeId} className="px-3 sm:px-4 py-2.5 sm:py-3 text-center text-[10px] uppercase tracking-wider font-semibold min-w-[90px] sm:min-w-[110px]">
                  <div>Judge {judgeId}</div>
                  <div className="text-[9px] font-normal text-[#9ca3af] normal-case tracking-normal">
                    {isRankMode ? 'Score / Rank' : 'Score'}
                  </div>
                </th>
              ))}

              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right text-[10px] uppercase tracking-wider font-semibold bg-[#111827] min-w-[90px] sm:min-w-[110px]">
                <div>{isRankMode ? 'Rank Sum' : 'Final Avg'}</div>
                <div className="text-[9px] font-normal text-[#9ca3af] normal-case tracking-normal">
                  {isRankMode ? 'lower = better' : 'higher = better'}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.length === 0 ? (
              <tr>
                <td colSpan={3 + judgeIds.length} className="px-4 py-8 text-center text-[#9ca3af] italic text-sm">
                  No scores submitted yet.
                </td>
              </tr>
            ) : standings.map((c, idx) => (
              <tr
                key={c.name}
                className={`border-b border-[#f0f4f2] transition-colors ${idx === 0 ? 'bg-amber-50 hover:bg-amber-100/60' : 'hover:bg-[#f0fdf6]'}`}
              >
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center font-bold text-[10px] sm:text-xs mx-auto ${getMedalClass(idx)}`}>
                    {idx + 1}
                  </div>
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-bold text-[#191c1e] text-xs sm:text-sm">{c.name}</td>

                {/* FIX: use judgeId (actual DB value) */}
                {judgeIds.map((judgeId) => {
                  const score   = getJudgeScore(c.name, judgeId);
                  const rankPos = getJudgeRank(c.name, judgeId);
                  return (
                    <td key={judgeId} className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                      {score !== null ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-mono font-bold text-[#191c1e] text-xs sm:text-sm">{score.toFixed(2)}</span>
                          {isRankMode && (
                            <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${rankPos === 1 ? 'bg-amber-100 text-amber-600' : 'bg-[#eef2ff] text-[#4f46e5]'}`}>
                              {getOrdinal(rankPos)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#d1d5db] font-mono text-xs">—</span>
                      )}
                    </td>
                  );
                })}

                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-mono font-bold text-[#006c49] bg-[#f9fafb] text-xs sm:text-sm">
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
