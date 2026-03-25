import React, { useState, useEffect } from 'react';

const LeaderBoard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ contestants: [], criteria: [], settings: {}, scores: [] });
  const [standings, setStandings] = useState([]);
  const API_BASE = "http://localhost:8080/api";

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/get-all-data`);
      const result = await res.json();
      
      if (result.contestants) {
        const calcType = result.settings?.computation_type || 'average';
        const isRankMode = calcType === 'rank';
        
        // 1. Calculate Standings
        const calculated = result.contestants.map(c => ({
          ...c,
          displayScore: isRankMode ? Math.round(c.final_score) : parseFloat(c.final_score).toFixed(2)
        }));

        // 2. Sort based on Admin Computation Type
        const sorted = [...calculated].sort((a, b) => {
          return isRankMode ? a.final_score - b.final_score : b.final_score - a.final_score;
        });

        setStandings(sorted);
        setData(result);
      }
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

  // Helper to get a specific score for a judge/contestant/criterion
  const getScore = (judgeId, contestantId, criterionId) => {
    const s = data.scores?.find(sc => 
      sc.judge_id == judgeId && 
      sc.contestant_id == contestantId && 
      sc.criterion_id == criterionId
    );
    return s ? s.score : 0;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-slate-900">
      <h1 className="text-2xl font-black mb-6 uppercase tracking-tight text-center">
        {data.settings?.contest_name} - Admin Results
      </h1>

      <div className="space-y-12">
        
        {/* TABLE 1: OFFICIAL WINNERS (FINAL STANDINGS) */}
        <section>
          <h2 className="text-lg font-bold mb-3 text-indigo-600 uppercase italic">01. Official Final Standings</h2>
          <table className="w-full bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="p-3 text-left">Rank</th>
                <th className="p-3 text-left">Contestant</th>
                <th className="p-3 text-right">Final {isRankMode ? 'Rank Sum' : 'Average'}</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((c, idx) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-indigo-50">
                  <td className="p-3 font-black text-indigo-600">{idx + 1}</td>
                  <td className="p-3 font-bold">{c.name} <span className="text-gray-400 text-xs">(#{c.entry_number})</span></td>
                  <td className="p-3 text-right font-mono font-bold">{c.displayScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* TABLES 2 & 3: JUDGE BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* We map through the judge count set by admin */}
          {Array.from({ length: data.settings?.judge_count || 0 }, (_, jIdx) => {
            const judgeId = jIdx + 1;
            return (
              <section key={judgeId}>
                <h2 className="text-md font-bold mb-3 text-slate-500 uppercase">Judge {judgeId} Detailed Scores</h2>
                <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="p-2 text-left">Contestant</th>
                        {data.criteria.map(crit => (
                          <th key={crit.id} className="p-2 text-center">{crit.name}</th>
                        ))}
                        <th className="p-2 text-right bg-gray-200">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.contestants.map(con => {
                        let judgeTotal = 0;
                        return (
                          <tr key={con.id} className="border-b">
                            <td className="p-2 font-bold bg-gray-50">{con.name}</td>
                            {data.criteria.map(crit => {
                              const score = getScore(judgeId, con.id, crit.id);
                              judgeTotal += parseFloat(score);
                              return (
                                <td key={crit.id} className="p-2 text-center">{score}</td>
                              );
                            })}
                            <td className="p-2 text-right font-bold bg-gray-100 italic">
                              {isRankMode ? Math.round(judgeTotal) : judgeTotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
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