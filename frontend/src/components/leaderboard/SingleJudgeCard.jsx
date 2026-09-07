import {getOrdinal} from './index'
export default function SingleJudgeCard({ judgeId, scores }) {
  return (
    <div>
      {/* FIX: label shows actual judge_id from DB */}
      <p className="text-[10px] sm:text-[11px] font-bold text-[var(--text2)] uppercase tracking-wider mb-2">
        Judge {judgeId}
      </p>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[var(--accent)] text-white">
            <tr>
              <th className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-center w-10 sm:w-12 text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold">Rank</th>
              <th className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-left text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold">Contestant</th>
              <th className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold bg-[var(--surface2)]">Total</th>
            </tr>
          </thead>
          <tbody>
            {scores.length === 0 ? (
              <tr>
                {/* FIX: label shows actual judge_id from DB */}
                <td colSpan={3} className="px-3 py-5 text-center text-[var(--text3)] italic text-xs">
                  No scores from Judge {judgeId} yet.
                </td>
              </tr>
            ) : scores.map((row, rIdx) => (
              <tr key={row.name} className="border-b border-[var(--border)] hover:bg-[var(--accent-lt)] transition-colors">
                <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-center">
                  <span className={`text-[9px] sm:text-[10px] font-bold ${rIdx === 0 ? 'text-[var(--amber)]' : 'text-[var(--text3)]'}`}>
                    {getOrdinal(rIdx + 1)}
                  </span>
                </td>
                <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 font-bold bg-[var(--surface2)] text-[var(--text1)]">{row.name}</td>
                <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right font-mono font-bold bg-[var(--surface2)] text-[var(--accent-mid)]">
                  {parseFloat(row.total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}