import {getOrdinal} from '../../utils/getOrdinal'
import {rankBadgeColor} from '../../utils/rankBadeColor'
export default function RankingsTable({ rankings, compType }) {
  return (
    <table className="hidden md:table w-full text-left">
      <thead>
        <tr className="bg-[#191c1e] text-white">
          <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest w-20">Place</th>
          <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest">Contestant</th>
          <th className="px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-widest">Score Total</th>
          <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-widest bg-[#111827]">
            {compType === 'rank' ? 'Rank Given' : 'Final Calc'}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#f0f4f2]">
        {rankings.map((con, idx) => (
          <tr
            key={con.id ?? idx}
            className={`transition-colors ${idx === 0 ? 'bg-amber-50 hover:bg-amber-100/60' : 'hover:bg-[#f0fdf6]'}`}
          >
            <td className="px-6 py-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${rankBadgeColor(idx)}`}>
                {idx + 1}
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="font-bold text-[#191c1e] text-base">{con.name}</div>
              <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mt-0.5">
                Entry #{con.id}
              </div>
            </td>
            <td className="px-6 py-5 text-center">
              <span className="font-mono font-bold text-[#191c1e]">
                {con.total.toFixed(2)} pts
              </span>
            </td>
            <td className="px-6 py-5 text-right bg-[#f9fafb]">
              {compType === 'rank' ? (
                <div className="flex flex-col items-end">
                  <span className={`text-xl font-extrabold ${idx === 0 ? 'text-[#006c49]' : 'text-[#191c1e]'}`}>
                    {getOrdinal(con.rankPosition)}
                  </span>
                  <span className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-wider">
                    This Judge's Rank
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-end">
                  <span className={`text-xl font-extrabold ${idx === 0 ? 'text-[#006c49]' : 'text-[#191c1e]'}`}>
                    {con.total.toFixed(2)}%
                  </span>
                  <span className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-wider">
                    Current Placement
                  </span>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}