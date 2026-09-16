import { memo } from 'react';

import { ScrollHint } from './index'
import { USALoader } from '../../../components/ui'

// Adjust this to your actual topbar height (px). If your topbar sets a
// CSS var like --topbar-height globally, this will pick it up automatically.
const TOPBAR_OFFSET = 'var(--topbar-height, 64px)';

const ScoringCard = memo(function ScoringCard({ tableHtml, loading, refreshing, waitSeconds = 0 }) {
  const hasTable = !!tableHtml;
  const timeLabel = waitSeconds > 0 ? ` (${waitSeconds}s)` : '';

  return (
    <>
      {!loading && tableHtml && <ScrollHint />}

      {loading && !hasTable ? (
        <USALoader
          fullScreen={false}
          prompt={`Building interface…${timeLabel}`}
          background="transparent"
        />
      ) : (
        <div className="ai-scroll-container" style={{ position: 'relative' }}>
          {(refreshing || loading) && (
            <div
              style={{
                position: 'sticky',
                top: TOPBAR_OFFSET,
                height: `calc(100vh - ${TOPBAR_OFFSET})`,
                marginBottom: `calc(-1 * (100vh - ${TOPBAR_OFFSET}))`,
                zIndex: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(4px)',
                pointerEvents: 'auto',
              }}
            >
              <USALoader
                fullScreen={false}
                prompt={loading ? `Please wait…${timeLabel}` : `Updating interface…${timeLabel}`}
                background="transparent"
              />
            </div>
          )}
          <div
            className="ai-rendered-content"
            dangerouslySetInnerHTML={{ __html: tableHtml }}
          />
        </div>
      )}
    </>
  );
}, (prev, next) =>
  prev.tableHtml    === next.tableHtml &&
  prev.loading      === next.loading &&
  prev.refreshing   === next.refreshing &&
  prev.waitSeconds  === next.waitSeconds
);

export default ScoringCard