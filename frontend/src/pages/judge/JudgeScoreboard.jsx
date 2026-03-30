import { useState, useEffect, useCallback } from 'react';

const JudgeScoreboard = () => {
  const [judgeId, setJudgeId] = useState(localStorage.getItem('judge_id') || '');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contestName, setContestName] = useState('Leaderboard');
  const [compType, setCompType] = useState('average');

  const API_BASE = "http://localhost:8080/api";

  const fetchMyRankings = useCallback(async (id, type) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/judge/my-scores?judgeId=${id}`);
      const data = await res.json();

      const formattedData = data.map(item => ({
        id: item.contestant_id || item.id,
        name: item.name || item.contestant_name || "Unknown",
        total: parseFloat(item.total || 0),
      }));

      // In AVERAGE mode: higher total = better → sort descending
      // In RANK mode: /judge/my-scores returns raw score totals (NOT rank positions)
      //   so we still sort descending by total, then assign rank positions ourselves
      const sorted = [...formattedData].sort((a, b) => b.total - a.total);

      // Assign rank positions (1st place = highest score regardless of mode)
      const withRanks = sorted.map((item, idx) => ({
        ...item,
        rankPosition: idx + 1,
      }));

      setRankings(withRanks);
    } catch (err) {
      console.error("Scoreboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    const storedId = localStorage.getItem('judge_id');
    if (storedId) setJudgeId(storedId);

    fetch(`${API_BASE}/get-all-data`)
      .then(res => res.json())
      .then(data => {
        setContestName(data.settings?.contest_name || "Tournament");
        const typeFromDB = data.settings?.computation_type || 'average';
        setCompType(typeFromDB);
        if (storedId) fetchMyRankings(storedId, typeFromDB);
      })
      .catch(err => console.error(err));
  }, [fetchMyRankings, API_BASE]);

  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  if (!judgeId) return <div className="p-20 text-center font-black">Identity Missing</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest">
                Judge #{judgeId}
              </span>
              <span className={`text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest ${
                compType === 'rank'
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-indigo-100 text-indigo-600'
              }`}>
                {compType === 'rank' ? 'Rank-Sum System' : 'Average System (High Wins)'}
              </span>
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tighter text-slate-900 leading-none">
              Live <span className="text-indigo-600 italic">Standings</span>
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="py-40 text-center animate-pulse text-slate-300 font-black">SYNCING SCORES...</div>
        ) : rankings.length === 0 ? (
          <div className="py-40 text-center text-slate-400 font-black uppercase tracking-widest">
            No scores submitted yet.
          </div>
        ) : (
          <div className="space-y-8">

            {/* RANKING TABLE */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Place</th>
                    <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Contestant</th>
                    <th className="p-8 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {compType === 'rank' ? 'Score Total' : 'Score Total'}
                    </th>
                    <th className="p-8 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {compType === 'rank' ? 'Rank Given' : 'Final Calculation'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rankings.map((con, idx) => (
                    <tr key={con.id ?? idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-8">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                          idx === 0
                            ? 'bg-amber-400 text-white shadow-lg shadow-amber-200'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="font-black text-slate-800 uppercase text-lg leading-tight">{con.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Entry #{con.id}
                        </div>
                      </td>
                      <td className="p-8 text-center">
                        <span className="text-sm font-bold text-slate-500 tabular-nums">
                          {con.total.toFixed(2)} pts
                        </span>
                      </td>
                      <td className="p-8 text-right">
                        <div className="flex flex-col items-end">
                          {compType === 'rank' ? (
                            <>
                              {/* In rank mode: show what rank THIS judge is giving this contestant */}
                              <span className={`text-2xl font-black ${idx === 0 ? 'text-indigo-600' : 'text-slate-900'}`}>
                                {getOrdinal(con.rankPosition)}
                              </span>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                This Judge's Rank
                              </span>
                            </>
                          ) : (
                            <>
                              <span className={`text-2xl font-black ${idx === 0 ? 'text-indigo-600' : 'text-slate-900'}`}>
                                {con.total.toFixed(2)}%
                              </span>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                Current Placement
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* LOGIC FOOTER */}
            <div className="p-8 bg-white border border-slate-200 rounded-[24px] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Computation Rule</span>
                <span className="text-xs font-black text-slate-800 uppercase italic">
                  {compType === 'rank'
                    ? "Rank-Sum System: Each judge ranks contestants by total score. Final winner has lowest rank sum across all judges."
                    : "Average System: Higher percentage values indicate higher performance."}
                </span>
              </div>
              <div className="hidden md:block w-px h-8 bg-slate-100 mx-8"></div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Synchronized</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default JudgeScoreboard;