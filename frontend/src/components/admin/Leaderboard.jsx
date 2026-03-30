import React, { useState, useEffect } from 'react';

const LeaderBoard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ contestants: [], criteria: [], settings: {} });
  const [standings, setStandings] = useState([]);
  const [judgeScores, setJudgeScores] = useState({});
  const API_BASE = "http://localhost:8080/api";

  const fetchResults = async () => {
    setLoading(true);
    try {
      const configRes = await fetch(`${API_BASE}/get-all-data`);
      const configData = await configRes.json();

      const lbRes = await fetch(`${API_BASE}/leaderboard`);
      const lbData = await lbRes.json();

      const isRankMode = configData.settings?.computation_type === 'rank';
      const judgeCount = configData.settings?.judge_count || 0;

      const sorted = lbData.map((item, idx) => ({
        ...item,
        rank: idx + 1,
        displayScore: isRankMode
          ? `Rank Sum: ${item.total_rank}`
          : parseFloat(item.final_score).toFixed(2)
      }));

      setStandings(sorted);
      setData(configData);

      const judgeData = {};
      for (let i = 1; i <= judgeCount; i++) {
        try {
          const res = await fetch(`${API_BASE}/judge/my-scores?judgeId=${i}`);
          const scores = await res.json();
          judgeData[i] = scores;
        } catch (err) {
          console.error(`Failed to fetch scores for judge ${i}:`, err);
          judgeData[i] = [];
        }
      }
      setJudgeScores(judgeData);

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  if (loading) return <div className="p-10 text-center font-bold">LOADING RESULTS...</div>;

  const isRankMode = data.settings?.computation_type === 'rank';
  const judgeCount = data.settings?.judge_count || 0;

  // Get a contestant's total score from a specific judge
  const getJudgeScore = (contestantName, judgeId) => {
    const list = judgeScores[judgeId] || [];
    const found = list.find(s => s.name === contestantName);
    return found ? parseFloat(found.total) : null;
  };

  // Get what rank this judge gives this contestant (by sorting their totals)
  const getJudgeRank = (contestantName, judgeId) => {
    const sorted = [...(judgeScores[judgeId] || [])].sort((a, b) => b.total - a.total);
    const idx = sorted.findIndex(s => s.name === contestantName);
    return idx >= 0 ? idx + 1 : null;
  };

  const getOrdinal = (n) => {
    if (!n) return '—';
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const medalStyle = (idx) => {
    if (idx === 0) return 'bg-amber-400 text-white';
    if (idx === 1) return 'bg-slate-300 text-slate-700';
    if (idx === 2) return 'bg-orange-300 text-white';
    return 'bg-slate-100 text-slate-400';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-slate-900">
      <h1 className="text-2xl font-black mb-6 uppercase tracking-tight text-center">
        {data.settings?.contest_name} - Admin Results
      </h1>

      <div className="space-y-12">

        {/* TABLE 1: OFFICIAL FINAL STANDINGS */}
        <section>
          <h2 className="text-lg font-bold mb-3 text-indigo-600 uppercase italic">
            01. Official Final Standings
          </h2>
          <table className="w-full bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="p-3 text-left">Rank</th>
                <th className="p-3 text-left">Contestant</th>
                <th className="p-3 text-right">
                  Final {isRankMode ? 'Rank Sum' : 'Average'}
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-400 italic">
                    No scores submitted yet.
                  </td>
                </tr>
              ) : (
                standings.map((c, idx) => (
                  <tr key={c.name} className="border-b border-gray-100 hover:bg-indigo-50">
                    <td className="p-3 font-black text-indigo-600">{idx + 1}</td>
                    <td className="p-3 font-bold">{c.name}</td>
                    <td className="p-3 text-right font-mono font-bold">
                      {isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* TABLE 2: JUDGE SUMMARY — every judge's score + rank per contestant */}
        <section>
          <h2 className="text-lg font-bold mb-1 text-indigo-600 uppercase italic">
            02. Judge Summary Table
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            {isRankMode
              ? 'Shows each judge\'s raw score total and the rank they give each contestant. Final column is the rank sum used for placement.'
              : 'Shows each judge\'s score total. Final column is the average across all judges.'}
          </p>
          <div className="overflow-x-auto bg-white border border-gray-200 shadow-sm rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-3 text-center w-14">Place</th>
                  <th className="p-3 text-left">Contestant</th>
                  {Array.from({ length: judgeCount }, (_, i) => (
                    <th key={i + 1} className="p-3 text-center whitespace-nowrap min-w-[100px]">
                      <div>Judge {i + 1}</div>
                      <div className="text-[10px] font-normal text-slate-300 uppercase tracking-wide">
                        {isRankMode ? 'Score / Rank Given' : 'Score'}
                      </div>
                    </th>
                  ))}
                  <th className="p-3 text-right bg-slate-700 whitespace-nowrap min-w-[100px]">
                    <div>{isRankMode ? 'Rank Sum' : 'Final Avg'}</div>
                    <div className="text-[10px] font-normal text-slate-300 uppercase tracking-wide">
                      {isRankMode ? 'lower = better' : 'higher = better'}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.length === 0 ? (
                  <tr>
                    <td colSpan={3 + judgeCount} className="p-4 text-center text-gray-400 italic">
                      No scores submitted yet.
                    </td>
                  </tr>
                ) : (
                  standings.map((c, idx) => (
                    <tr
                      key={c.name}
                      className={`border-b border-gray-100 ${idx === 0 ? 'bg-amber-50' : 'hover:bg-slate-50'}`}
                    >
                      {/* Place badge */}
                      <td className="p-3 text-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm mx-auto ${medalStyle(idx)}`}>
                          {idx + 1}
                        </div>
                      </td>

                      {/* Contestant Name */}
                      <td className="p-3 font-bold text-slate-800">{c.name}</td>

                      {/* Per-Judge column */}
                      {Array.from({ length: judgeCount }, (_, jIdx) => {
                        const jId = jIdx + 1;
                        const score = getJudgeScore(c.name, jId);
                        const rankPos = getJudgeRank(c.name, jId);
                        return (
                          <td key={jId} className="p-3 text-center">
                            {score !== null ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="font-mono font-bold text-slate-800">
                                  {score.toFixed(2)}
                                </span>
                                {isRankMode && (
                                  <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                                    rankPos === 1
                                      ? 'bg-amber-100 text-amber-600'
                                      : 'bg-indigo-50 text-indigo-400'
                                  }`}>
                                    {getOrdinal(rankPos)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-300 font-mono">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Final Score column */}
                      <td className="p-3 text-right font-mono font-black text-indigo-600 bg-slate-50">
                        {isRankMode
                          ? c.total_rank
                          : parseFloat(c.final_score).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* TABLE 3: INDIVIDUAL JUDGE BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {Array.from({ length: judgeCount }, (_, jIdx) => {
            const judgeId = jIdx + 1;
            const scores = [...(judgeScores[judgeId] || [])].sort((a, b) => b.total - a.total);

            return (
              <section key={judgeId}>
                <h2 className="text-md font-bold mb-3 text-slate-500 uppercase">
                  Judge {judgeId} Scores
                </h2>
                <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="p-2 text-center w-10">Rank</th>
                        <th className="p-2 text-left">Contestant</th>
                        <th className="p-2 text-right bg-gray-200">Total Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-3 text-center text-gray-400 italic">
                            No scores from Judge {judgeId} yet.
                          </td>
                        </tr>
                      ) : (
                        scores.map((row, rIdx) => (
                          <tr key={row.name} className="border-b hover:bg-gray-50">
                            <td className="p-2 text-center">
                              <span className={`text-[10px] font-black ${rIdx === 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                                {getOrdinal(rIdx + 1)}
                              </span>
                            </td>
                            <td className="p-2 font-bold bg-gray-50">{row.name}</td>
                            <td className="p-2 text-right font-bold bg-gray-100 italic font-mono">
                              {parseFloat(row.total).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>

      </div>

      <div className="mt-10 text-center">
        <button
          onClick={fetchResults}
          className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all"
        >
          Refresh Live Data
        </button>
      </div>
    </div>
  );
};

export default LeaderBoard;