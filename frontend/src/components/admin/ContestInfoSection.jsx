import { card } from './card.js'
const ContestInfoSection = ({ contestName, setContestName, contestType, setContestType }) => (
  <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div className="section-heading">Contest Information</div>
    <div>
      <div className="field-label">Contest Name</div>
      <input className="field-input" placeholder="e.g. Miss Barangay Fiesta 2025" value={contestName} onChange={e => setContestName(e.target.value)} />
    </div>
    <div>
      <div className="field-label">Contest Type</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
        {['pageant', 'talent show', 'debate', 'sports', 'academic'].map(t => (
          <button key={t} onClick={() => setContestType(t)} style={{ padding: '7px 14px', borderRadius: 10, border: `1.5px solid ${contestType === t ? 'var(--accent-mid)' : 'var(--border)'}`, background: contestType === t ? 'var(--accent-lt)' : 'var(--surface2)', color: contestType === t ? 'var(--accent)' : 'var(--text2)', fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'inherit', transition: 'all .15s' }}>
            {t}
          </button>
        ))}
      </div>
    </div>
  </div>
);
export default ContestInfoSection