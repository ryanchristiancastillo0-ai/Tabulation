import { useState } from 'react';

const STATUS_COLORS = {
  idle:       '#64748b',
  requesting: '#f59e0b',
  generating: '#3b82f6',
  done:       '#22c55e',
  failed:     '#ef4444',
};

// On-screen debug console showing what the AI returned for the judge UI.
// Displays the prompt, model, generation state, latency, and a preview of the
// AI-generated HTML so you can verify the LLM is actually responding.
export default function AiDebugConsole({ debug }) {
  const [open, setOpen] = useState(false);
  const d = debug || {};
  const state = d.state || 'idle';
  const color = STATUS_COLORS[state] || STATUS_COLORS.idle;

  return (
    <div
      style={{
        marginTop: 16,
        border: `1px solid ${color}55`,
        borderRadius: 12,
        background: '#0f172a',
        color: '#e2e8f0',
        fontFamily: "'JetBrains Mono', 'Cascadia Code', monospace",
        fontSize: 12,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', background: 'transparent', border: 'none',
          color: 'inherit', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontWeight: 700 }}>AI Console</span>
        <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>
          {state} · {d.responseTimeMs ? `${(d.responseTimeMs / 1000).toFixed(1)}s` : '—'}
        </span>
        <span style={{ color: '#64748b' }}>{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px', display: 'grid', gap: 10 }}>
          {!d.lastRequestAt && (
            <div style={{ color: '#94a3b8' }}>
              No AI request yet. Save the config in the admin, then the judge page will call the AI here.
            </div>
          )}

          {d.lastRequestAt && (
            <>
              <Row label="Requested" value={d.lastRequestAt} />
              <Row label="State" value={state} color={color} />
              <Row label="Model" value={d.model || '—'} />
              <Row label="Generation ID" value={d.generationId || '—'} mono />
              <Row label="HTTP Status" value={d.httpStatus || '—'} />
              <Row label="Latency" value={d.responseTimeMs ? `${(d.responseTimeMs / 1000).toFixed(1)}s` : '—'} />
              <Row label="Result size" value={d.resultLength ? `${d.resultLength} chars` : '—'} />
              {d.error && (
                <div>
                  <div style={{ color: '#fca5a5', fontWeight: 700, marginBottom: 4 }}>Error</div>
                  <pre style={{ background: '#1e293b', padding: 8, borderRadius: 8, whiteSpace: 'pre-wrap', margin: 0 }}>
                    {d.error}
                  </pre>
                </div>
              )}
            </>
          )}

          {d.prompt && (
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 4 }}>Prompt sent to AI</div>
              <pre style={{ background: '#1e293b', padding: 8, borderRadius: 8, whiteSpace: 'pre-wrap', margin: 0, maxHeight: 120, overflow: 'auto' }}>
                {d.prompt}
              </pre>
            </div>
          )}

          {d.resultPreview && (
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 4 }}>
                AI response preview ({d.resultLength} chars total)
              </div>
              <pre
                style={{
                  background: '#1e293b', padding: 8, borderRadius: 8,
                  whiteSpace: 'pre-wrap', margin: 0, maxHeight: 240, overflow: 'auto',
                  wordBreak: 'break-all',
                }}
              >
                {d.resultPreview}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color, mono }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={{ color: '#94a3b8', flexShrink: 0, minWidth: 110 }}>{label}</span>
      <span
        style={{
          color: color || '#e2e8f0',
          fontFamily: mono ? 'inherit' : 'inherit',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
    </div>
  );
}