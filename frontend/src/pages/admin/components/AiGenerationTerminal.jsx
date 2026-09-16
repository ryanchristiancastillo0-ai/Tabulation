import { useEffect, useRef, useState } from 'react';
import { USALoader } from '../../../components/ui/Loading';

// Terminal that shows the AI generating the judge UI in real time.
// used in two places: as a centered modal while a save is in progress, and as
// an inline panel under the AI prompt so the admin can re-read the last code.
export default function AiGenerationTerminal({
  variant = 'modal',
  open = true,
  status = 'streaming', // 'streaming' | 'done' | 'error' | 'idle'
  text = '',
  error = '',
  model = '',
  startedAt = null,
  cached = false,
  generationId = null,
  onClose = null,
}) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (status !== 'streaming' || !startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status, startedAt]);

  const elapsed = (status !== 'idle' && startedAt)
    ? Math.max(0, Math.floor((now - startedAt) / 1000))
    : 0;

  const bodyRef = useRef(null);
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [text, status]);

  const dotColor = status === 'done' ? '#22c55e' : status === 'error' ? '#ef4444' : '#f59e0b';
  const statusLabel =
    status === 'done'   ? 'Done — saved to ui_cache'
    : status === 'error' ? 'Generation failed'
    : cached              ? 'Found cached design'
    : 'Generating…';

  const copyHtml = async () => {
    try { await navigator.clipboard.writeText(text || ''); } catch { /* ignore */ }
  };

  const terminal = (
    <div
      style={{
        fontFamily: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
        fontSize: 12,
        lineHeight: 1.55,
        background: '#0b1220',
        border: `1px solid ${dotColor}55`,
        borderRadius: 12,
        overflow: 'hidden',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          padding: '10px 14px', background: '#0f172a', borderBottom: '1px solid #1e293b',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, flexShrink: 0,
          animation: status === 'streaming' ? 'ai-blink 1s steps(2) infinite' : 'none' }} />
        <span style={{ fontWeight: 800, letterSpacing: '0.02em' }}>AI UI GENERATOR</span>
        {model && <span style={{ color: '#94a3b8' }}>· {model}</span>}
        <span style={{ color: '#64748b' }}>
          {status === 'streaming' ? `${elapsed}s` : ['done', 'error', 'idle'].includes(status) && startedAt ? `${elapsed}s` : ''}
        </span>
        {generationId && <span style={{ color: '#475569', marginLeft: 'auto', fontSize: 10 }}>id {String(generationId).slice(0, 8)}</span>}
        {status === 'done' && (
          <button onClick={copyHtml} style={{ marginLeft: 'auto', fontSize: 10, padding: '3px 10px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#cbd5e1', cursor: 'pointer', fontFamily: 'inherit' }}>
            Copy HTML
          </button>
        )}
      </div>

      {/* Body */}
      <div ref={bodyRef} style={{
        padding: '12px 14px', maxHeight: variant === 'modal' ? '46vh' : 260,
        overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      }}>
        {status === 'error' && (
          <div style={{ color: '#fca5a5', fontWeight: 700, marginBottom: 8 }}>✗ {error || 'AI generation failed.'}</div>
        )}
        {status === 'streaming' && !text && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
            <USALoader fullScreen={false} dark prompt="Generating judge UI…" background="transparent" />
          </div>
        )}
        {text}
        {status === 'streaming' && text && <span style={{ color: dotColor }}>▍</span>}
        {status === 'done' && (
          <div style={{ color: '#86efac', fontWeight: 700, marginTop: 10 }}>
            ✓ Judge UI generated and saved to ui_cache{cached ? ' (already cached — no LLM call needed)' : ''}.
          </div>
        )}
      </div>

      {/* Footer */}
      {(variant === 'modal' || status !== 'streaming') && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '10px 14px', borderTop: '1px solid #1e293b', background: '#0f172a' }}>
          <span style={{ color: '#64748b', fontSize: 10 }}>
            {status === 'streaming' ? 'The judge page updates automatically once this finishes' : statusLabel}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              style={{ fontSize: 11, padding: '5px 14px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {status === 'streaming' ? 'Stop' : 'Close'}
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (variant === 'inline') return open ? terminal : null;

  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,6,23,0.6)', backdropFilter: 'blur(3px)', padding: 16,
    }}>
      <div style={{ width: 'min(860px, 100%)' }}>{terminal}</div>
      <style>{`@keyframes ai-blink { 50% { opacity: 0.25 } }`}</style>
    </div>
  );
}