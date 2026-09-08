 import { memo } from 'react';

 
 import {ScrollHint} from '../../components/judge/index'
 import { USALoader } from '../../components/index'

 const ScoringCard = memo(function ScoringCard({ tableHtml, loading }) {
  return (
    <>
      {!loading && tableHtml && <ScrollHint />}

      {loading ? (
        <USALoader
          fullScreen={false}
          prompt="Building interface…"
          background="transparent"
        />
      ) : (
        <div className="ai-scroll-container">
          <div
            className="ai-rendered-content"
            dangerouslySetInnerHTML={{ __html: tableHtml }}
          />
        </div>
      )}
    </>
  );
}, (prev, next) =>
  prev.tableHtml === next.tableHtml &&
  prev.loading   === next.loading
);

export default ScoringCard