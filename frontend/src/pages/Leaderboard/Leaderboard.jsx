// pages/LeaderBoard.jsx
import  { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';
import {getOrdinal,ExportAllPanel,
 FullscreenView,HeroBanner,LoadingState,NavBar,RefreshBar,
  Table1FinalStandings,Table2JudgeSummary,Table3JudgeBreakdowns,exportToCSV,
  exportToPNG

} from '../../components/leaderboard/index'

function getSchoolIdFromToken() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1])).school_id || null;
  } catch {
    return null;
  }
}


const LeaderBoard = () => {
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [data,         setData]         = useState({ contestants: [], criteria: [], settings: {} });
  const [standings,    setStandings]    = useState([]);
  const [judgeScores,  setJudgeScores]  = useState({});
  const [judgeIds,     setJudgeIds]     = useState([]);
  const [lastRefresh,  setLastRefresh]  = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const schoolId = getSchoolIdFromToken();
      if (!schoolId) throw new Error('Could not determine school ID from session. Please log in again.');

      const [configData, lbData, rawJudgeIds] = await Promise.all([
        apiClient.get(`/public/get-all-data?school_id=${schoolId}`),
        apiClient.get(`/public/leaderboard?school_id=${schoolId}`).catch(err => {
          console.warn('[LeaderBoard] leaderboard failed:', err.message);
          return [];
        }),
        apiClient.get(`/public/judge/ids?school_id=${schoolId}`).catch(err => {
          console.warn('[LeaderBoard] judge/ids failed:', err.message);
          return [];
        }),
      ]);

      const safeConfig = configData || { contestants: [], criteria: [], settings: {} };
      setData(safeConfig);

      const judgeCount = Number(safeConfig?.settings?.judge_count) || 0;

      const lbArray = Array.isArray(lbData) ? lbData : Array.isArray(lbData?.data) ? lbData.data : [];
      setStandings(lbArray.map((item, idx) => ({ ...item, rank: idx + 1 })));

      const idsRaw      = Array.isArray(rawJudgeIds) ? rawJudgeIds : Array.isArray(rawJudgeIds?.data) ? rawJudgeIds.data : [];
      // FIX: use actual DB judge_ids; only fall back to sequential if nothing submitted yet
      const resolvedIds = idsRaw.length > 0
        ? idsRaw
        : Array.from({ length: judgeCount }, (_, i) => i + 1);
      setJudgeIds(resolvedIds);

      // Fetch per-judge scores using actual judge_id values
      const judgeEntries = await Promise.all(
        resolvedIds.map(async (judgeId) => {
          try {
            const res    = await apiClient.get(`/public/judge/scores?school_id=${schoolId}&judgeId=${judgeId}`);
            const scores = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
            return [judgeId, scores];
          } catch (err) {
            console.warn(`[LeaderBoard] judge ${judgeId} scores failed:`, err.message);
            return [judgeId, []];
          }
        })
      );

      setJudgeScores(Object.fromEntries(judgeEntries));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('[LeaderBoard] Fetch error:', err);
      setError(err.message || 'Failed to load results.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isRankMode  = data.settings?.computation_type === 'rank';
  const judgeCount  = judgeIds.length || Number(data.settings?.judge_count) || 0;
  const contestName = data.settings?.contest_name || 'Competition';

  // Lookup helpers — keyed by actual judge_id
  const getJudgeScore = (name, judgeId) => {
    const found = (judgeScores[judgeId] || []).find(s => s.name === name);
    return found ? parseFloat(found.total) : null;
  };

  const getJudgeRank = (name, judgeId) => {
    const sorted = [...(judgeScores[judgeId] || [])].sort((a, b) => b.total - a.total);
    const idx    = sorted.findIndex(s => s.name === name);
    return idx >= 0 ? idx + 1 : null;
  };

  // ── CSV export builders ─────────────────────────────────────
  const exportStandingsCSV = () => {
    const headers = ['Rank', 'Contestant', isRankMode ? 'Rank Sum' : 'Final Average'];
    const rows    = standings.map((c, idx) => [
      idx + 1, c.name,
      isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2),
    ]);
    exportToCSV(`${contestName}_standings.csv`, headers, rows);
  };

  const exportSummaryCSV = () => {
    // FIX: header labels use actual judgeId
    const judgeHeaders = judgeIds.flatMap(jId =>
      isRankMode ? [`Judge ${jId} Score`, `Judge ${jId} Rank`] : [`Judge ${jId} Score`]
    );
    const headers = ['Place', 'Contestant', ...judgeHeaders, isRankMode ? 'Rank Sum' : 'Final Avg'];
    const rows    = standings.map((c, idx) => {
      const judgeData = judgeIds.flatMap(jId => {
        const score = getJudgeScore(c.name, jId);
        const rank  = getJudgeRank(c.name, jId);
        return isRankMode
          ? [score !== null ? score.toFixed(2) : '—', getOrdinal(rank)]
          : [score !== null ? score.toFixed(2) : '—'];
      });
      return [idx + 1, c.name, ...judgeData, isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2)];
    });
    exportToCSV(`${contestName}_judge_summary.csv`, headers, rows);
  };

  const exportJudgesCSV = () => {
    const lines = [];
    for (const judgeId of judgeIds) {
      const scores = [...(judgeScores[judgeId] || [])].sort((a, b) => b.total - a.total);
      // FIX: CSV section header uses actual judgeId
      lines.push(`Judge ${judgeId}`);
      lines.push(['Rank', 'Contestant', 'Total'].join(','));
      scores.forEach((row, rIdx) => lines.push([rIdx + 1, row.name, parseFloat(row.total).toFixed(2)].join(',')));
      lines.push('');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${contestName}_judge_breakdowns.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportStandingsPNG = () => exportToPNG('table-standings', `${contestName}_standings.png`);
  const exportSummaryPNG   = () => exportToPNG('table-summary',   `${contestName}_judge_summary.png`);
  const exportJudgesPNG    = () => exportToPNG('table-judges',    `${contestName}_judge_breakdowns.png`);

  const handleExportAll = (selected, format) => {
    if (format === 'csv') {
      if (selected.standings) exportStandingsCSV();
      if (selected.summary)   exportSummaryCSV();
      if (selected.judges)    exportJudgesCSV();
    } else {
      let delay = 0;
      if (selected.standings) { setTimeout(exportStandingsPNG, delay); delay += 600; }
      if (selected.summary)   { setTimeout(exportSummaryPNG,   delay); delay += 600; }
      if (selected.judges)    { setTimeout(exportJudgesPNG,    delay); }
    }
  };

  // ── Render guards ───────────────────────────────────────────
  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={fetchResults} />;

  if (isFullscreen) {
    return (
      <FullscreenView
        data={data}
        standings={standings}
        isRankMode={isRankMode}
        onExit={() => setIsFullscreen(false)}
        onExportCSV={exportStandingsCSV}
      />
    );
  }

  // ── Main render ─────────────────────────────────────────────
  return (
    <div className="bg-[#f7f9fb] min-h-screen font-['Inter',sans-serif] text-[#191c1e]">

      <NavBar />
      <HeroBanner contestName={contestName} isRankMode={isRankMode} />

      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">

        <ExportAllPanel onExportAll={handleExportAll} />

        <Table1FinalStandings
          standings={standings}
          isRankMode={isRankMode}
          onFullscreen={() => setIsFullscreen(true)}
          onCSV={exportStandingsCSV}
          onPNG={exportStandingsPNG}
        />

        <Table2JudgeSummary
          standings={standings}
          judgeIds={judgeIds}
          isRankMode={isRankMode}
          judgeCount={judgeCount}
          getJudgeScore={getJudgeScore}
          getJudgeRank={getJudgeRank}
          onCSV={exportSummaryCSV}
          onPNG={exportSummaryPNG}
        />

        <Table3JudgeBreakdowns
          judgeIds={judgeIds}
          judgeScores={judgeScores}
          onCSV={exportJudgesCSV}
          onPNG={exportJudgesPNG}
        />

        <RefreshBar onRefresh={fetchResults} lastRefresh={lastRefresh} />

      </div>
    </div>
  );
};

export default LeaderBoard;