import {getMedalStyleFS} from './index'
export default function FullscreenView({ data, standings, isRankMode, onExit, onExportCSV }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#006c49', display: 'flex', flexDirection: 'column',
      padding: 'clamp(20px, 4vw, 48px) clamp(16px, 5vw, 64px)',
      fontFamily: "'Inter', sans-serif", overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <div>
          <span style={{
            display: 'inline-block', background: 'rgba(255,255,255,0.18)', color: '#fff',
            fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 99,
            letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10,
          }}>
            Official Final Standings
          </span>
          <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2.6rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {data.settings?.contest_name || 'Competition Results'}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6, fontWeight: 500 }}>
            {isRankMode ? 'Rank-Based Scoring' : 'Average-Based Scoring'} · Live Results
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={onExportCSV}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >↓ CSV</button>
          <button
            onClick={onExit}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >✕ Exit</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 300 }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.25)' }}>
              {['Rank', 'Contestant', isRankMode ? 'Rank Sum' : 'Final Score'].map((h, i) => (
                <th key={h} style={{ padding: 'clamp(10px,2vw,16px) clamp(12px,3vw,24px)', textAlign: i === 2 ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '60px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
                  No scores submitted yet.
                </td>
              </tr>
            ) : standings.map((c, idx) => (
              <tr key={c.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: idx === 0 ? 'rgba(251,191,36,0.12)' : 'transparent' }}>
                <td style={{ padding: 'clamp(12px,2vw,22px) clamp(12px,3vw,24px)' }}>
                  <div style={{ width: 'clamp(36px,5vw,52px)', height: 'clamp(36px,5vw,52px)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 'clamp(14px,2vw,20px)', ...getMedalStyleFS(idx) }}>
                    {idx + 1}
                  </div>
                </td>
                <td style={{ padding: 'clamp(12px,2vw,22px) clamp(12px,3vw,24px)', fontSize: 'clamp(1rem,3vw,1.6rem)', fontWeight: 800, color: '#fff' }}>{c.name}</td>
                <td style={{ padding: 'clamp(12px,2vw,22px) clamp(12px,3vw,24px)', textAlign: 'right', fontSize: 'clamp(1.2rem,3.5vw,2rem)', fontWeight: 900, fontFamily: 'monospace', color: idx === 0 ? '#fbbf24' : '#fff' }}>
                  {isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 32, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Veridict · Live Results
        </span>
      </div>
    </div>
  );
}
