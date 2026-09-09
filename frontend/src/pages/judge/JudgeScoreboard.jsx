import { useState, useEffect, useCallback } from 'react';
import {getSchoolId} from '../../utils/getSchoolId'
import {FooterInfo,Hero,RankingsCards,RankingsTable,IdentityMissing} from '../../components/judgeLeaderboard/index'
import { USALoader } from '../../components/index';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';


const JudgeScoreboard = () => {
  const [judgeId, setJudgeId]       = useState(localStorage.getItem(`judge_id_${getSchoolId()}`) || '');
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
    const storedId = localStorage.getItem(`judge_id_${getSchoolId()}`);
    if (storedId) setJudgeId(storedId);

    // Public route — judges have no admin JWT, so call the public
    // getAllData endpoint using school_id in the query string.
    const school_id = getSchoolId();
    fetch(`${API_BASE}/public/get-all-data?school_id=${school_id}`)
      .then(res => res.json())
      .then(data => {
        setContestName(data.settings?.contest_name || 'Tournament');
        setCompType(data.settings?.computation_type || 'average');
        if (storedId) fetchMyRankings(storedId);
      })
      .catch(err => console.error('Config fetch error:', err.message));
  }, [fetchMyRankings]);

  if (!judgeId) return <IdentityMissing />;

  return (
    <div className="min-h-screen bg-[#FBFCF9] font-sans text-[#14201A]">
      <div className="max-w-5xl xl:max-w-[1400px] 2xl:max-w-[1920px] 3xl:max-w-[2560px] 4xl:max-w-[3200px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 2xl:p-12">

        <Hero
          judgeId={judgeId}
          compType={compType}
          contestName={contestName}
          onRefresh={() => fetchMyRankings(judgeId)}
        />

        {loading ? (
          <USALoader
            fullScreen={false}
            prompt="Syncing scores…"
            background="transparent"
          />
        ) : rankings.length === 0 ? (
          <div className="py-24 sm:py-40 text-center text-[#9ca3af] font-bold uppercase tracking-widest text-sm">
            No scores submitted yet.
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white border border-[#BBCABB] rounded-sm overflow-hidden">
              <RankingsTable rankings={rankings} compType={compType} />
              <RankingsCards rankings={rankings} compType={compType} />
            </div>

            <FooterInfo compType={compType} />
          </div>
        )}
      </div>
    </div>
  );
};

export default JudgeScoreboard;