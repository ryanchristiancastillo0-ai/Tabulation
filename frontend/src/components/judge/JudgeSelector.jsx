
import {
 ShieldCheck, Lock,

} from 'lucide-react';



export default function JudgeSelector({ selectedJudge, judgeCount, updateJudge, isJudgeLocked, primary, compact = false, darkBg = false }) {
  const selectDisabled = isJudgeLocked && !!selectedJudge;

  return (
    <div className="relative" style={{ width: compact ? undefined : '100%' }}>
      <select
        value={selectedJudge}
        onChange={e => {
          if (selectDisabled) return;
          updateJudge(e.target.value);
        }}
        disabled={selectDisabled}
        title={selectDisabled ? 'Judge switching is locked by the administrator' : ''}
        className="appearance-none rounded-lg font-bold outline-none transition-all"
        style={{
          fontFamily:    'inherit',
          fontSize:      compact ? 13 : 14,
          paddingTop:    compact ? 6 : 10,
          paddingBottom: compact ? 6 : 10,
          paddingLeft:   compact ? 10 : 12,
          paddingRight:  32,
          minWidth:      compact ? '110px' : undefined,
          width:         compact ? undefined : '100%',
          background:    darkBg
            ? (selectDisabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.14)')
            : (selectDisabled ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.95)'),
          border:        darkBg
            ? '1.5px solid rgba(255,255,255,0.25)'
            : (selectDisabled ? '1.5px solid rgba(255,100,100,0.5)' : '1.5px solid rgba(255,255,255,0.4)'),
          color:         darkBg ? '#fff' : (selectDisabled ? '#6b7280' : '#191c1e'),
          cursor:        selectDisabled ? 'not-allowed' : 'pointer',
          opacity:       selectDisabled ? 0.7 : 1,
        }}
      >
        <option value="" style={{ color: '#191c1e' }}>Select Judge</option>
        {Array.from({ length: judgeCount || 0 }, (_, i) => (
          <option key={i + 1} value={i + 1} style={{ color: '#191c1e' }}>Judge {i + 1}</option>
        ))}
      </select>
      <div
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: darkBg ? 'rgba(255,255,255,0.6)' : (selectDisabled ? '#ef4444' : primary) }}
      >
        {selectDisabled ? <Lock size={12} /> : <ShieldCheck size={12} />}
      </div>
    </div>
  );
}