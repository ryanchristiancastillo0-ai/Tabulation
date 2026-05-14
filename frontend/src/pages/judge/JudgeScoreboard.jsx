import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function getSchoolId() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('school_id')) return params.get('school_id');
    const direct = localStorage.getItem('school_id');
    if (direct) return direct;
    const user = localStorage.getItem('adminUser');
    if (user) return JSON.parse(user)?.school_id || 1;
    const auth = localStorage.getItem('auth');
    if (auth) return JSON.parse(auth)?.admin?.school_id || 1;
    return 1;
  } catch {
    return 1;
  }
}

const JudgeScoreboard = () => {
  const [judgeId, setJudgeId]       = useState(localStorage.getItem('judge_id') || '');
  const [rankings, setRankings]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [contestName, setContestName] = useState('Leaderboard');
  const [compType, setCompType]     = useState('average');

  const fetchMyRankings = useCallback(async (id) => {
    if (!id) return;
    const school_id = getSchoolId();
    setLoading(true);
    try {
      // Public route — plain fetch, no JWT, but needs school_id
      const res  = await fetch(`${API_BASE}/judge/my-scores?judgeId=${id}&school_id=${school_id}`);
      const data = await res.json();

      // Guard: make sure it's an array before mapping
      if (!Array.isArray(data)) {
        console.error('my-scores returned non-array:', data);
        setRankings([]);
        return;
      }

      const formatted = data.map(item => ({
        id:    item.contestant_id || item.id,
        name:  item.name || item.contestant_name || 'Unknown',
        total: parseFloat(item.total || 0),
      }));

      const withRanks = [...formatted]
        .sort((a, b) => b.total - a.total)
        .map((item, idx) => ({ ...item, rankPosition: idx + 1 }));

      setRankings(withRanks);
    } catch (err) {
      console.error('Scoreboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedId = localStorage.getItem('judge_id');
    if (storedId) setJudgeId(storedId);

    // Protected route — use apiClient (sends JWT automatically)
    apiClient.get('/get-all-data')
      .then(data => {
        setContestName(data.settings?.contest_name || 'Tournament');
        setCompType(data.settings?.computation_type || 'average');
        if (storedId) fetchMyRankings(storedId);
      })
      .catch(err => console.error('Config fetch error:', err.message));
  }, [fetchMyRankings]);

  const getOrdinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  if (!judgeId) return (
    <div className="p-20 text-center font-black text-[#191c1e]">
      Identity Missing — Please select a judge first.
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-6 md:p-12 font-sans text-[#191c1e]">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-[#191c1e] text-white text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-widest">
                Judge #{judgeId}
              </span>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-widest ${
                compType === 'rank'
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-[#10b981]/10 text-[#006c49]'
              }`}>
                {compType === 'rank' ? 'Rank-Sum System' : 'Average System'}
              </span>
            </div>
            <h1 className="text-5xl font-extrabold uppercase tracking-tight text-[#191c1e] leading-none">
              Live <span className="text-[#006c49] italic">Standings</span>
            </h1>
            <p className="text-sm text-[#3c4a42] mt-2 font-medium">{contestName}</p>
          </div>

          <button
            onClick={() => fetchMyRankings(judgeId)}
            className="bg-[#10b981] text-white px-6 py-3 rounded-full text-sm font-bold hover:opacity-90 transition-all self-start md:self-auto"
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-40 text-center text-[#9ca3af] font-bold uppercase tracking-widest animate-pulse">
            Syncing Scores…
          </div>
        ) : rankings.length === 0 ? (
          <div className="py-40 text-center text-[#9ca3af] font-bold uppercase tracking-widest">
            No scores submitted yet.
          </div>
        ) : (
          <div className="space-y-6">

            {/* RANKINGS TABLE */}
            <div className="bg-white border border-[#bbcabf] rounded-2xl overflow-hidden">
              <table className="w-full text-left">
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
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          idx === 0 ? 'bg-amber-400 text-white' :
                          idx === 1 ? 'bg-slate-400 text-white' :
                          idx === 2 ? 'bg-orange-400 text-white' :
                                      'bg-slate-100 text-slate-400'
                        }`}>
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
            </div>

            {/* FOOTER INFO */}
            <div className="p-6 bg-white border border-[#bbcabf] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest block mb-1">
                  Computation Rule
                </span>
                <span className="text-xs font-semibold text-[#3c4a42]">
                  {compType === 'rank'
                    ? 'Rank-Sum: Each judge ranks contestants by total. Lowest rank sum wins.'
                    : 'Average System: Higher percentage = better performance.'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-[#3c4a42] uppercase tracking-widest">
                  Synchronized
                </span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default JudgeScoreboard;