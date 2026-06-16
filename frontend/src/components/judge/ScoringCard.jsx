 import { memo } from 'react';

 
 import {CardHeaderStrip,LoadingSpinner,ScrollHint} from '../../components/judge/index'

 const ScoringCard = memo(function ScoringCard({ tableHtml, loading, selectedJudge, primary, secondary }) {
  return (
    <div
      className="bg-white rounded-xl sm:rounded-2xl overflow-hidden w-full"
      style={{
        border:    `1px solid ${primary}20`,
        boxShadow: `0 4px 24px ${primary}15`,
      }}
    >
      <CardHeaderStrip primary={primary} secondary={secondary} selectedJudge={selectedJudge} />

      {!loading && tableHtml && <ScrollHint />}

      {loading ? (
        <LoadingSpinner secondary={secondary} />
      ) : (
        <div className="ai-scroll-container">
          <div
            className="ai-rendered-content"
            dangerouslySetInnerHTML={{ __html: tableHtml }}
          />
        </div>
      )}
    </div>
  );
}, (prev, next) =>
  prev.tableHtml     === next.tableHtml     &&
  prev.loading       === next.loading       &&
  prev.selectedJudge === next.selectedJudge &&
  prev.primary       === next.primary       &&
  prev.secondary     === next.secondary
);

export default ScoringCard