import {useContestContext} from '../../providers/ContestContext'
import {
 Lock, Unlock,  Loader,
 
 AlertTriangle,
 
} from 'lucide-react';
import { card } from './card.js'
const JudgesSection = ({ judgeCount, setJudgeCount, calculationType, setCalculationType }) => {
  const { isJudgeLocked, toggleLock, lockLoading, lockError } = useContestContext();

  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div className="section-heading" style={{ margin: 0 }}>Judge & Calculation Configuration</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: isJudgeLocked ? 'var(--red)' : 'var(--accent-mid)', boxShadow: isJudgeLocked ? '0 0 0 3px rgba(190,18,60,0.15)' : '0 0 0 3px var(--accent-lt)', transition: 'all .3s' }} />
          <button
            onClick={toggleLock}
            disabled={lockLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 9, border: isJudgeLocked ? 'none' : '1px solid var(--border)', background: lockLoading ? 'var(--surface2)' : isJudgeLocked ? '#be123c' : 'var(--surface)', color: lockLoading ? 'var(--text3)' : isJudgeLocked ? '#fff' : 'var(--text2)', fontWeight: 800, fontSize: 12, cursor: lockLoading ? 'not-allowed' : 'pointer', transition: 'all .2s', fontFamily: 'inherit' }}
          >
            {lockLoading ? <Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : isJudgeLocked ? <Lock size={13} /> : <Unlock size={13} />}
            {lockLoading ? 'SAVING…' : isJudgeLocked ? 'JUDGES LOCKED' : 'LOCK JUDGES'}
          </button>
        </div>
      </div>

      {lockError && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={13} /> Failed to save: {lockError}
        </div>
      )}

      <div style={{ background: isJudgeLocked ? '#fff1f2' : 'var(--accent-lt)', border: `1px solid ${isJudgeLocked ? '#fecdd3' : 'var(--accent-bd)'}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 600, color: isJudgeLocked ? '#dc2626' : 'var(--accent)', transition: 'all .3s' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isJudgeLocked ? '#ef4444' : 'var(--accent-mid)', flexShrink: 0, animation: 'pulse 2s infinite' }} />
        {isJudgeLocked ? 'Judges are currently LOCKED — scoring is disabled on the judge portal.' : 'Judges are UNLOCKED — scoring is active on the judge portal.'}
      </div>

      <div>
        <div className="field-label" style={{ marginBottom: 12 }}>Number of Judges</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="counter-btn" onClick={() => setJudgeCount(j => Math.max(1, j - 1))}>−</button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, color: 'var(--accent)', minWidth: 48, textAlign: 'center' }}>{judgeCount}</span>
          <button className="counter-btn" onClick={() => setJudgeCount(j => Math.min(20, j + 1))}>+</button>
        </div>
      </div>

      <div>
        <div className="field-label" style={{ marginBottom: 12 }}>Result Calculation Type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="sm:flex-row">
          {[
            { id: 'average', title: 'By Average', desc: 'Standard percentage-based average. Highest score wins.' },
            { id: 'rank',    title: 'By Place (Rank-Sum)', desc: 'Rank points summed from all judges. Lowest sum wins.' },
          ].map(opt => {
            const active = calculationType === opt.id;
            return (
              <div key={opt.id} onClick={() => setCalculationType(opt.id)} style={{ flex: 1, padding: 14, borderRadius: 12, cursor: 'pointer', transition: 'all .2s', border: `2px solid ${active ? 'var(--accent-mid)' : 'var(--border)'}`, background: active ? 'var(--accent-lt)' : 'var(--surface2)', boxShadow: active ? '0 0 0 3px var(--accent-lt)' : 'none' }}>
                <div style={{ fontWeight: 800, color: active ? 'var(--accent)' : 'var(--text1)', fontSize: 14 }}>{opt.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{opt.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

export default JudgesSection