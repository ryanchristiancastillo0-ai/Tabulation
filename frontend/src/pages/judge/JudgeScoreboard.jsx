import { useState, useEffect, useCallback } from 'react';

const JudgeScoreboard = () => {
  // 1. STATE & STORAGE
  const [judgeId, setJudgeId] = useState(localStorage.getItem('judge_id') || '');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contestName, setContestName] = useState('Leaderboard');

  const API_BASE = "http://localhost:8080/api";

  // 2. FETCH RANKINGS (Sorted by Highest Total)
  const fetchMyRankings = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      // Endpoint: Fetches contestant names and summed scores for THIS judge
      const res = await fetch(`${API_BASE}/judge/my-scores?judgeId=${id}`);
      const data = await res.json();
      
      // Sort data: Highest Score = Index 0 (First Place)
      const sorted = data.sort((a, b) => b.total - a.total);
      setRankings(sorted);
    } catch (err) {
      console.error("Scoreboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. INITIAL LOAD & SETTINGS
  useEffect(() => {
    // Listen for storage changes in case judge ID changes in another tab
    const storedId = localStorage.getItem('judge_id');
    if (storedId) {
      setJudgeId(storedId);
      fetchMyRankings(storedId);
    }

    // Get Contest Name for the header
    fetch(`${API_BASE}/get-all-data`)
      .then(res => res.json())
      .then(data => setContestName(data.settings?.contest_name || "Tournament"))
      .catch(err => console.error(err));
  }, [fetchMyRankings]);

  // 4. LOGOUT / CLEAR IDENTITY
  const handleLogout = () => {
    localStorage.removeItem('judge_id');
    setJudgeId('');
    setRankings([]);
  };

  // --- RENDER: IDENTITY MISSING ---
  if (!judgeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-red-50 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">!</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase italic tracking-tighter">Identity Required</h2>
          <p className="text-gray-400 font-medium mb-8 leading-relaxed">
            We don't know who you are yet! Please visit the Judge Panel and select your ID to see your rankings.
          </p>
          <button 
            onClick={() => window.location.href = '/judge'} // Adjust route as needed
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            Go to Judge Panel
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN SCOREBOARD ---
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em]">
                Judge #{judgeId}
              </span>
              <span className="text-gray-300 font-bold uppercase text-[10px] tracking-widest italic">Live Rankings</span>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-gray-900 leading-none">
              Your <span className="text-blue-600 italic">Winners</span>
            </h1>
            <p className="text-gray-400 font-bold mt-2 opacity-60 uppercase text-xs">{contestName}</p>
          </div>

          <button 
            onClick={handleLogout}
            className="text-xs font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Switch Judge ID
          </button>
        </div>

        {/* RANKING LIST */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Syncing Scores...</p>
          </div>
        ) : rankings.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-[2rem] py-32 text-center">
            <p className="text-gray-400 font-bold uppercase text-sm italic tracking-widest">No scores submitted for this session yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {rankings.map((contestant, index) => {
              const isFirst = index === 0;
              return (
                <div 
                  key={index} 
                  className={`
                    group flex items-center justify-between p-6 rounded-3xl transition-all duration-300
                    ${isFirst 
                      ? 'bg-white border-2 border-yellow-400 shadow-2xl shadow-yellow-100 scale-[1.02]' 
                      : 'bg-white border border-gray-100 shadow-sm hover:border-blue-200 hover:-translate-y-1'}
                  `}
                >
                  <div className="flex items-center gap-6">
                    {/* Rank Badge */}
                    <div className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black
                      ${isFirst ? 'bg-yellow-400 text-yellow-900 rotate-3' : 'bg-gray-50 text-gray-400'}
                    `}>
                      {index + 1}
                    </div>

                    <div>
                      <h3 className={`text-xl font-black uppercase tracking-tight ${isFirst ? 'text-gray-900' : 'text-gray-700'}`}>
                        {contestant.name}
                      </h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{isFirst ? '⭐ Current First Place' : 'Contestant'}</p>
                    </div>
                  </div>

                  {/* Points Section */}
                  <div className="text-right">
                    <p className={`text-3xl font-black leading-none ${isFirst ? 'text-blue-600' : 'text-gray-800'}`}>
                      {contestant.total}
                    </p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Total Points</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
          Rankings are updated in real-time based on your latest judge inputs.
        </div>

      </div>
    </div>
  );
};

export default JudgeScoreboard;