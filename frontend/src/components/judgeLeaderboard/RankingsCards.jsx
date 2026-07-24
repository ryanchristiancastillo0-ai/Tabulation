import {getOrdinal} from '../../utils/getOrdinal'
import {rankBadgeColor} from '../../utils/rankBadeColor'
export default function RankingsCards({ rankings, compType }) {
  return (
    <div className="md:hidden divide-y divide-[#f0f4f2]">
      {rankings.map((con, idx) => (
        <div
          key={con.id ?? idx}
          className={`p-4 flex items-center gap-3 ${idx === 0 ? 'bg-amber-50' : ''}`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${rankBadgeColor(idx)}`}>
            {idx + 1}
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-bold text-[#191c1e] text-sm truncate">{con.name}</div>
            <div className="text-[9px] font-semibold text-[#9ca3af] uppercase tracking-widest mt-0.5">
              Entry #{con.id} · {con.total.toFixed(2)} pts
            </div>
          </div>

          <div className="text-right shrink-0">
            {compType === 'rank' ? (
              <>
                <div className={`text-lg font-extrabold ${idx === 0 ? 'text-[#006c49]' : 'text-[#191c1e]'}`}>
                  {getOrdinal(con.rankPosition)}
                </div>
                <div className="text-[8px] font-bold text-[#9ca3af] uppercase tracking-wider">
                  Rank
                </div>
              </>
            ) : (
              <>
                <div className={`text-lg font-extrabold ${idx === 0 ? 'text-[#006c49]' : 'text-[#191c1e]'}`}>
                  {con.total.toFixed(2)}%
                </div>
                <div className="text-[8px] font-bold text-[#9ca3af] uppercase tracking-wider">
                  Placement
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
