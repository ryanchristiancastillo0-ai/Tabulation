// pages/LeaderBoard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';

// ── Export Utilities ───────────────────────────────────────────

const exportToCSV = (filename, headers, rows) => {
  const escape = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))];
  const blob  = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href      = url;
  a.download  = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const exportToPNG = async (tableId, filename) => {
  // Dynamically load html2canvas if not present
  if (!window.html2canvas) {
    await new Promise((resolve, reject) => {
      const s   = document.createElement('script');
      s.src     = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload  = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const el = document.getElementById(tableId);
  if (!el) return;
  const canvas = await window.html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  const url    = canvas.toDataURL('image/png');
  const a      = document.createElement('a');
  a.href       = url;
  a.download   = filename;
  a.click();
};

// ── Export Button ──────────────────────────────────────────────

const ExportMenu = ({ onCSV, onPNG, compact = false }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 border border-[#bbcabf] bg-white hover:bg-[#f0fdf6] text-[#006c49] font-bold rounded-lg transition-all ${compact ? 'text-[10px] px-2.5 py-1.5' : 'text-xs px-3 py-2'}`}
      >
        <svg width={compact ? 10 : 12} height={compact ? 10 : 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Export
        <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#e0e3e5] rounded-xl shadow-xl z-50 overflow-hidden min-w-[160px]">
          <div className="px-3 py-2 text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest border-b border-[#f0f4f2]">
            Export As
          </div>
          <button
            onClick={() => { onCSV(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[#191c1e] hover:bg-[#f0fdf6] transition-colors text-left"
          >
            <span className="w-5 h-5 bg-[#dcfce7] text-[#006c49] rounded flex items-center justify-center font-bold text-[9px]">CSV</span>
            Export as CSV
          </button>
          <button
            onClick={() => { onPNG(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[#191c1e] hover:bg-[#f0fdf6] transition-colors text-left"
          >
            <span className="w-5 h-5 bg-[#ede9fe] text-[#7c3aed] rounded flex items-center justify-center font-bold text-[9px]">PNG</span>
            Export as Image
          </button>
        </div>
      )}
    </div>
  );
};

// ── Export All Panel ───────────────────────────────────────────

const ExportAllPanel = ({ onExportAll, exportOptions, contestName }) => {
  const [selected, setSelected] = useState({ standings: true, summary: true, judges: true });
  const [format,   setFormat]   = useState('csv');
  const [open,     setOpen]     = useState(false);

  const toggle = (key) => setSelected(s => ({ ...s, [key]: !s[key] }));
  const anySelected = Object.values(selected).some(Boolean);

  return (
    <div className="bg-white border border-[#bbcabf] rounded-2xl overflow-hidden">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-[#191c1e] to-[#374151] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-sm">Export Data</div>
            <div className="text-white/50 text-[10px]">Choose tables and format to download</div>
          </div>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
        >
          {open ? 'Collapse' : 'Expand'}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {open && (
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Table selection */}
            <div className="md:col-span-2">
              <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">Select Tables</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'standings', label: '01 · Final Standings' },
                  { key: 'summary',   label: '02 · Judge Summary' },
                  { key: 'judges',    label: '03 · Judge Breakdowns' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggle(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                      selected[key]
                        ? 'bg-[#006c49] border-[#006c49] text-white'
                        : 'bg-white border-[#e0e3e5] text-[#6b7280] hover:border-[#006c49]'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all ${
                      selected[key] ? 'border-white bg-white' : 'border-current'
                    }`}>
                      {selected[key] && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#006c49" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Format selection */}
            <div>
              <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">Format</div>
              <div className="flex flex-col gap-2">
                {[
                  { val: 'csv', label: 'CSV Spreadsheet', badge: 'CSV', color: 'bg-[#dcfce7] text-[#006c49]' },
                  { val: 'png', label: 'Image (PNG)',      badge: 'PNG', color: 'bg-[#ede9fe] text-[#7c3aed]' },
                ].map(({ val, label, badge, color }) => (
                  <button
                    key={val}
                    onClick={() => setFormat(val)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all text-left ${
                      format === val
                        ? 'border-[#006c49] bg-[#f0fdf6] text-[#006c49]'
                        : 'border-[#e0e3e5] bg-white text-[#6b7280] hover:border-[#006c49]'
                    }`}
                  >
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${color}`}>{badge}</span>
                    {label}
                    {format === val && (
                      <svg className="ml-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Export button */}
          <div className="mt-5 pt-4 border-t border-[#f0f4f2] flex items-center justify-between">
            <div className="text-xs text-[#9ca3af]">
              {Object.values(selected).filter(Boolean).length} table{Object.values(selected).filter(Boolean).length !== 1 ? 's' : ''} selected · {format.toUpperCase()} format
            </div>
            <button
              disabled={!anySelected}
              onClick={() => onExportAll(selected, format)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                anySelected
                  ? 'bg-[#006c49] text-white hover:opacity-90 shadow-sm'
                  : 'bg-[#e0e3e5] text-[#9ca3af] cursor-not-allowed'
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export Selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────

const LeaderBoard = () => {
  const [loading,      setLoading]      = useState(true);
  const [data,         setData]         = useState({ contestants: [], criteria: [], settings: {} });
  const [standings,    setStandings]    = useState([]);
  const [judgeScores,  setJudgeScores]  = useState({});
  const [judgeIds,     setJudgeIds]     = useState([]);   // real IDs from DB
  const [lastRefresh,  setLastRefresh]  = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      // All three requests use the protected routes — auth is handled by apiClient.
      const [configData, lbData, rawJudgeIds] = await Promise.all([
        apiClient.get('/get-all-data'),
        apiClient.get('/leaderboard'),
        apiClient.get('/judge/ids'),
      ]);

      const judgeCount  = Number(configData?.settings?.judge_count) || 0;
      const lbArray     = Array.isArray(lbData) ? lbData
                        : Array.isArray(lbData?.data) ? lbData.data : [];
      const sorted      = lbArray.map((item, idx) => ({ ...item, rank: idx + 1 }));

      setStandings(sorted);
      setData(configData || { contestants: [], criteria: [], settings: {} });

      // Real judge IDs from DB, fall back to 1..judgeCount
      const idsRaw      = Array.isArray(rawJudgeIds) ? rawJudgeIds
                        : Array.isArray(rawJudgeIds?.data) ? rawJudgeIds.data : [];
      const resolvedIds = idsRaw.length > 0
        ? idsRaw
        : Array.from({ length: judgeCount }, (_, i) => i + 1);

      setJudgeIds(resolvedIds);

      // Fetch each judge's scores using the protected route
      const judgeEntries = await Promise.all(
        resolvedIds.map(async (jId) => {
          try {
            const res    = await apiClient.get(`/judge/my-scores?judgeId=${jId}`);
            const scores = Array.isArray(res) ? res
                         : Array.isArray(res?.data) ? res.data : [];
            return [jId, scores];
          } catch (e) {
            return [jId, []];
          }
        })
      );

      setJudgeScores(Object.fromEntries(judgeEntries));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('[LeaderBoard] Fetch error:', err);
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
  const judgeCount  = judgeIds.length || data.settings?.judge_count || 0;
  const contestName = data.settings?.contest_name || 'Competition';

  const getJudgeScore = (name, judgeId) => {
    const list  = judgeScores[judgeId] || [];
    const found = list.find(s => s.name === name);
    return found ? parseFloat(found.total) : null;
  };

  const getJudgeRank = (name, judgeId) => {
    const sorted = [...(judgeScores[judgeId] || [])].sort((a, b) => b.total - a.total);
    const idx    = sorted.findIndex(s => s.name === name);
    return idx >= 0 ? idx + 1 : null;
  };

  const getOrdinal = (n) => {
    if (!n) return '—';
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const medalStyle = (idx) => {
    if (idx === 0) return 'bg-amber-400 text-white';
    if (idx === 1) return 'bg-slate-400 text-white';
    if (idx === 2) return 'bg-orange-400 text-white';
    return 'bg-slate-100 text-slate-400';
  };

  const medalStyleFS = (idx) => {
    if (idx === 0) return { background: '#f59e0b', color: '#fff' };
    if (idx === 1) return { background: '#94a3b8', color: '#fff' };
    if (idx === 2) return { background: '#f97316', color: '#fff' };
    return { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' };
  };

  // ── CSV builders ───────────────────────────────────────────

  const exportStandingsCSV = () => {
    const headers = ['Rank', 'Contestant', isRankMode ? 'Rank Sum' : 'Final Average'];
    const rows    = standings.map((c, idx) => [
      idx + 1,
      c.name,
      isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2),
    ]);
    exportToCSV(`${contestName}_standings.csv`, headers, rows);
  };

  const exportSummaryCSV = () => {
    const judgeHeaders = judgeIds.flatMap(jId =>
      isRankMode ? [`Judge ${jId} Score`, `Judge ${jId} Rank`] : [`Judge ${jId} Score`]
    );
    const headers = ['Place', 'Contestant', ...judgeHeaders, isRankMode ? 'Rank Sum' : 'Final Avg'];
    const rows    = standings.map((c, idx) => {
      const judgeData = judgeIds.flatMap(jId => {
        const score = getJudgeScore(c.name, jId);
        const rank  = getJudgeRank(c.name, jId);
        if (isRankMode) return [score !== null ? score.toFixed(2) : '—', getOrdinal(rank)];
        return [score !== null ? score.toFixed(2) : '—'];
      });
      return [
        idx + 1,
        c.name,
        ...judgeData,
        isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2),
      ];
    });
    exportToCSV(`${contestName}_judge_summary.csv`, headers, rows);
  };

  const exportJudgesCSV = () => {
    // One section per judge, separated by blank lines
    const lines = [];
    for (const judgeId of judgeIds) {
      const scores  = [...(judgeScores[judgeId] || [])].sort((a, b) => b.total - a.total);
      lines.push([`Judge ${judgeId}`].join(','));
      lines.push(['Rank', 'Contestant', 'Total'].join(','));
      scores.forEach((row, rIdx) => {
        lines.push([rIdx + 1, row.name, parseFloat(row.total).toFixed(2)].join(','));
      });
      lines.push('');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${contestName}_judge_breakdowns.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── PNG exports ────────────────────────────────────────────

  const exportStandingsPNG = () => exportToPNG('table-standings', `${contestName}_standings.png`);
  const exportSummaryPNG   = () => exportToPNG('table-summary',   `${contestName}_judge_summary.png`);
  const exportJudgesPNG    = () => exportToPNG('table-judges',    `${contestName}_judge_breakdowns.png`);

  // ── Export All ─────────────────────────────────────────────

  const handleExportAll = (selected, format) => {
    if (format === 'csv') {
      if (selected.standings) exportStandingsCSV();
      if (selected.summary)   exportSummaryCSV();
      if (selected.judges)    exportJudgesCSV();
    } else {
      // PNG: slight delay between each to avoid browser blocking
      let delay = 0;
      if (selected.standings) { setTimeout(exportStandingsPNG, delay); delay += 600; }
      if (selected.summary)   { setTimeout(exportSummaryPNG,   delay); delay += 600; }
      if (selected.judges)    { setTimeout(exportJudgesPNG,    delay); }
    }
  };

  // ── Fullscreen ─────────────────────────────────────────────

  if (isFullscreen) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#006c49', display: 'flex', flexDirection: 'column',
          padding: '48px 64px', fontFamily: "'Inter', sans-serif", overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <span style={{
              display: 'inline-block', background: 'rgba(255,255,255,0.18)', color: '#fff',
              fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99,
              letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12,
            }}>Official Final Standings</span>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {data.settings?.contest_name || 'Competition Results'}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6, fontWeight: 500 }}>
              {isRankMode ? 'Rank-Based Scoring' : 'Average-Based Scoring'} · Live Results
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={exportStandingsCSV}
              style={{
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13,
                fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em',
              }}
            >↓ CSV</button>
            <button
              onClick={() => setIsFullscreen(false)}
              style={{
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13,
                fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em',
              }}
            >✕ Exit Fullscreen</button>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.25)' }}>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', width: 80 }}>Rank</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contestant</th>
              <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {isRankMode ? 'Rank Sum' : 'Final Score'}
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.length === 0 ? (
              <tr><td colSpan={3} style={{ padding: '60px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>No scores submitted yet.</td></tr>
            ) : (
              standings.map((c, idx) => (
                <tr key={c.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: idx === 0 ? 'rgba(251,191,36,0.12)' : 'transparent' }}>
                  <td style={{ padding: '22px 24px' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, ...medalStyleFS(idx) }}>
                      {idx + 1}
                    </div>
                  </td>
                  <td style={{ padding: '22px 24px', fontSize: '1.6rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>{c.name}</td>
                  <td style={{ padding: '22px 24px', textAlign: 'right', fontSize: '2rem', fontWeight: 900, fontFamily: 'monospace', color: idx === 0 ? '#fbbf24' : '#fff' }}>
                    {isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={{ marginTop: 'auto', paddingTop: 40, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Veridict · Live Results
          </span>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen font-['Inter',sans-serif]">
        <nav className="bg-[#f7f9fb] border-b border-[#e0e3e5] px-12 h-16 flex items-center justify-between">
          <div className="text-xl font-bold text-[#006c49] tracking-tight">Veridict</div>
          <span className="bg-[#10b981] text-white text-xs font-bold px-3 py-1 rounded-md tracking-wide">Live Results</span>
        </nav>
        <div className="flex items-center justify-center h-64 text-[#6b7280] text-sm">Fetching results…</div>
      </div>
    );
  }

  // ── Normal page view ───────────────────────────────────────

  return (
    <div className="bg-[#f7f9fb] min-h-screen font-['Inter',sans-serif] text-[#191c1e]">

      {/* Nav */}
      <nav className="bg-[#f7f9fb] sticky top-0 z-50 border-b border-[#e0e3e5] px-12 h-16 flex items-center justify-between">
        <div className="text-xl font-bold text-[#006c49] tracking-tight">Veridict</div>
        <span className="bg-[#10b981] text-white text-xs font-bold px-3 py-1 rounded-md tracking-wide uppercase">Live Results</span>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#006c49] to-[#10b981] px-12 py-10">
        <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3">
          Competition Portal
        </span>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">
          {data.settings?.contest_name || 'Competition Results'}
        </h1>
        <p className="text-white/75 text-sm">
          {isRankMode ? 'Rank-Based Scoring · Admin View' : 'Average-Based Scoring · Admin View'}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── EXPORT ALL PANEL ── */}
        <ExportAllPanel
          contestName={contestName}
          onExportAll={handleExportAll}
        />

        {/* ── TABLE 1: OFFICIAL FINAL STANDINGS ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel number="01" label="Official Final Standings" />
            <div className="flex items-center gap-2">
              <ExportMenu
                onCSV={exportStandingsCSV}
                onPNG={exportStandingsPNG}
              />
              <button
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-2 bg-[#006c49] text-white text-xs font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
                Fullscreen
              </button>
            </div>
          </div>

          <div id="table-standings" className="bg-white border border-[#bbcabf] rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#006c49] to-[#10b981] px-6 py-4 flex items-center justify-between">
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
                {standings.length} Contestant{standings.length !== 1 ? 's' : ''}
              </span>
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
                {isRankMode ? 'Lower rank sum wins' : 'Higher score wins'}
              </span>
            </div>

            <table className="w-full">
              <thead className="bg-[#191c1e] text-white">
                <tr>
                  <th className="px-6 py-4 text-center w-20 text-[11px] uppercase tracking-wider font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-wider font-semibold">Contestant</th>
                  <th className="px-6 py-4 text-right text-[11px] uppercase tracking-wider font-semibold">
                    {isRankMode ? 'Rank Sum' : 'Final Average'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-[#9ca3af] italic text-sm">
                      No scores submitted yet.
                    </td>
                  </tr>
                ) : (
                  standings.map((c, idx) => (
                    <tr
                      key={c.name}
                      className={`border-b border-[#f0f4f2] transition-colors ${
                        idx === 0 ? 'bg-amber-50 hover:bg-amber-100/60' : 'hover:bg-[#f0fdf6]'
                      }`}
                    >
                      <td className="px-6 py-5 text-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm mx-auto ${medalStyle(idx)}`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-[#191c1e] text-lg">{c.name}</div>
                        {idx === 0 && (
                          <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mt-0.5">
                            🏆 Current Leader
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`font-mono font-black text-2xl ${idx === 0 ? 'text-[#006c49]' : 'text-[#191c1e]'}`}>
                          {isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── TABLE 2: JUDGE SUMMARY ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel number="02" label="Judge Summary Table" />
            <ExportMenu
              onCSV={exportSummaryCSV}
              onPNG={exportSummaryPNG}
            />
          </div>
          <p className="text-xs text-[#9ca3af] mb-3 -mt-1">
            {isRankMode
              ? "Shows each judge's raw score total and the rank they give each contestant."
              : "Shows each judge's score total. Final column is the average across all judges."}
          </p>
          <div id="table-summary" className="overflow-x-auto bg-white border border-[#bbcabf] rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-[#191c1e] text-white">
                <tr>
                  <th className="px-4 py-3 text-center w-16 text-[11px] uppercase tracking-wider font-semibold">Place</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold">Contestant</th>
                  {judgeIds.map((jId, i) => (
                    <th key={jId} className="px-4 py-3 text-center text-[11px] uppercase tracking-wider font-semibold min-w-[110px]">
                      <div>Judge {i + 1}</div>
                      <div className="text-[9px] font-normal text-[#9ca3af] normal-case tracking-normal">
                        {isRankMode ? 'Score / Rank' : 'Score'}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-semibold bg-[#111827] min-w-[110px]">
                    <div>{isRankMode ? 'Rank Sum' : 'Final Avg'}</div>
                    <div className="text-[9px] font-normal text-[#9ca3af] normal-case tracking-normal">
                      {isRankMode ? 'lower = better' : 'higher = better'}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.length === 0 ? (
                  <tr>
                    <td colSpan={3 + judgeCount} className="px-4 py-8 text-center text-[#9ca3af] italic text-sm">
                      No scores submitted yet.
                    </td>
                  </tr>
                ) : (
                  standings.map((c, idx) => (
                    <tr
                      key={c.name}
                      className={`border-b border-[#f0f4f2] transition-colors ${
                        idx === 0 ? 'bg-amber-50 hover:bg-amber-100/60' : 'hover:bg-[#f0fdf6]'
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs mx-auto ${medalStyle(idx)}`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#191c1e]">{c.name}</td>
                      {judgeIds.map((jId) => {
                        const score   = getJudgeScore(c.name, jId);
                        const rankPos = getJudgeRank(c.name, jId);
                        return (
                          <td key={jId} className="px-4 py-3 text-center">
                            {score !== null ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="font-mono font-bold text-[#191c1e]">{score.toFixed(2)}</span>
                                {isRankMode && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    rankPos === 1 ? 'bg-amber-100 text-amber-600' : 'bg-[#eef2ff] text-[#4f46e5]'
                                  }`}>
                                    {getOrdinal(rankPos)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#d1d5db] font-mono">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#006c49] bg-[#f9fafb]">
                        {isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── TABLE 3: INDIVIDUAL JUDGE BREAKDOWN ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel number="03" label="Individual Judge Breakdowns" />
            <ExportMenu
              onCSV={exportJudgesCSV}
              onPNG={exportJudgesPNG}
            />
          </div>
          <div id="table-judges" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {judgeIds.map((judgeId, jIdx) => {
              const scores = [...(judgeScores[judgeId] || [])].sort((a, b) => b.total - a.total);
              return (
                <div key={judgeId}>
                  <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-2">
                    Judge {jIdx + 1}
                  </p>
                  <div className="bg-white border border-[#bbcabf] rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-[#374151] text-white">
                        <tr>
                          <th className="px-3 py-2.5 text-center w-12 text-[10px] uppercase tracking-wider font-semibold">Rank</th>
                          <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-semibold">Contestant</th>
                          <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider font-semibold bg-[#1f2937]">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scores.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-3 py-5 text-center text-[#9ca3af] italic">
                              No scores from Judge {jIdx + 1} yet.
                            </td>
                          </tr>
                        ) : (
                          scores.map((row, rIdx) => (
                            <tr key={row.name} className="border-b border-[#f0f4f2] hover:bg-[#f0fdf6] transition-colors">
                              <td className="px-3 py-2.5 text-center">
                                <span className={`text-[10px] font-bold ${rIdx === 0 ? 'text-amber-500' : 'text-[#94a3b8]'}`}>
                                  {getOrdinal(rIdx + 1)}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 font-bold bg-[#f9fafb] text-[#191c1e]">{row.name}</td>
                              <td className="px-3 py-2.5 text-right font-mono font-bold bg-[#f1f5f9] text-[#006c49]">
                                {parseFloat(row.total).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Refresh */}
        <div className="text-center pt-4">
          <button
            onClick={fetchResults}
            className="bg-[#10b981] text-white px-10 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-sm"
          >
            ↻ Refresh Live Data
          </button>
          {lastRefresh && (
            <p className="text-xs text-[#9ca3af] mt-2">
              Last refreshed at {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

const SectionLabel = ({ number, label }) => (
  <div className="flex items-center gap-2">
    <div className="w-3.5 h-0.5 bg-[#10b981] rounded-full" />
    <span className="text-[11px] font-bold text-[#006c49] uppercase tracking-widest">
      {number}. {label}
    </span>
  </div>
);

export default LeaderBoard;