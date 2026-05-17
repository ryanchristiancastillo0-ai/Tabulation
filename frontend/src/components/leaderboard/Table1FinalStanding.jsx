
import {SectionLabel,ExportMenu,FullscreenIcon, getMedalClass} from './index'



export default  function Table1FinalStandings({ standings, isRankMode, onFullscreen, onCSV, onPNG }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <SectionLabel number="01" label="Official Final Standings" />
        <div className="flex items-center gap-2 shrink-0">
          <ExportMenu onCSV={onCSV} onPNG={onPNG} />
          <button
            onClick={onFullscreen}
            className="flex items-center gap-1.5 bg-[#006c49] text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:opacity-90 transition-all"
          >
            <FullscreenIcon />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>
      </div>

      <div id="table-standings" className="bg-white border border-[#bbcabf] rounded-xl overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#006c49] to-[#10b981] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-wrap gap-2">
          <span className="text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            {standings.length} Contestant{standings.length !== 1 ? 's' : ''}
          </span>
          <span className="text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            {isRankMode ? 'Lower rank sum wins' : 'Higher score wins'}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[300px]">
            <thead className="bg-[#191c1e] text-white">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center w-14 sm:w-20 text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Rank</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Contestant</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">
                  {isRankMode ? 'Rank Sum' : 'Final Average'}
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-[#9ca3af] italic text-sm">
                    No scores submitted yet.
                  </td>
                </tr>
              ) : standings.map((c, idx) => (
                <tr
                  key={c.name}
                  className={`border-b border-[#f0f4f2] transition-colors ${idx === 0 ? 'bg-amber-50 hover:bg-amber-100/60' : 'hover:bg-[#f0fdf6]'}`}
                >
                  <td className="px-3 sm:px-6 py-3 sm:py-5 text-center">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm mx-auto ${getMedalClass(idx)}`}>
                      {idx + 1}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-5">
                    <div className="font-bold text-[#191c1e] text-sm sm:text-lg leading-tight">{c.name}</div>
                    {idx === 0 && (
                      <div className="text-[9px] sm:text-[10px] font-bold text-amber-500 uppercase tracking-wider mt-0.5">
                        🏆 Current Leader
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-5 text-right">
                    <span className={`font-mono font-black text-lg sm:text-2xl ${idx === 0 ? 'text-[#006c49]' : 'text-[#191c1e]'}`}>
                      {isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
