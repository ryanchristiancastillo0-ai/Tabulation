import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CriteriaHeader({ criteria, primary, secondary }) {
  if (!criteria?.length) return null;

  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.percentage ?? 0), 0);
  const roundedTotal = Math.round(totalWeight);
  const ready = roundedTotal === 100;

  return (
    <div
      className="w-full rounded-xl sm:rounded-2xl mb-4 sm:mb-7 overflow-hidden"
      style={{
        background: '#fff',
        border:     `1px solid ${primary}25`,
        boxShadow:  `0 8px 30px ${primary}0f`,
      }}
    >
      {/* ── Title bar (centered) ─────────────────────────────────────── */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            12,
          padding:        '14px 28px',
          borderBottom:   `1px solid ${primary}12`,
          background:     `linear-gradient(90deg, ${primary}0a, #fff 45%, ${primary}0a)`,
        }}
      >
        <div
          style={{
            width:     8,
            height:    8,
            borderRadius: '50%',
            background:   secondary,
            boxShadow:    `0 0 0 4px ${secondary}28`,
            flexShrink:   0,
            animation:    'pulse 2s infinite',
          }}
        />
        <span
          style={{
            fontSize:      12,
            fontWeight:    800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color:         '#3c4a42',
          }}
        >
          Scoring Criteria
        </span>
        <span
          style={{
            fontSize:      10,
            fontWeight:    700,
            letterSpacing: '0.08em',
            color:         '#9ca3af',
            marginTop:     1,
          }}
        >
          · {criteria.length} {
            criteria.length === 1 ? 'criterion' : 'criteria'
          }
        </span>
      </div>

      {/* ── Criterion cards ──────────────────────────────────────────── */}
      <div style={{ padding: '16px 20px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {criteria.map((c, i) => {
          const weight = Math.max(0, Math.round(Number(c.percentage ?? 0)));
          const num = String(i + 1).padStart(2, '0');
          return (
            <div
              key={c.id ?? i}
              style={{
                background:   `linear-gradient(180deg, #fff, ${primary}04)`,
                border:       `1px solid ${primary}10`,
                borderRadius: 12,
                padding:      '11px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 9 }}>
                {/* Number chip */}
                <div
                  style={{
                    flexShrink:   0,
                    width:        30,
                    height:       30,
                    borderRadius: 9,
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    background:   `${primary}10`,
                    border:       `1px solid ${primary}1a`,
                    color:        primary,
                    fontSize:     11,
                    fontWeight:   800,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {num}
                </div>

                {/* Name */}
                <span
                  style={{
                    fontSize:   13,
                    fontWeight: 600,
                    color:      '#191c1e',
                    minWidth:   0,
                    overflow:   'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex:       1,
                  }}
                >
                  {c.name}
                </span>

                {/* Max points badge */}
                <span
                  style={{
                    flexShrink:   0,
                    fontSize:     10,
                    fontWeight:   700,
                    letterSpacing: '0.04em',
                    color:        '#6b7280',
                    background:   '#f3f4f6',
                    border:       '1px solid #e5e7eb',
                    borderRadius: 999,
                    padding:      '3px 9px',
                    whiteSpace:   'nowrap',
                  }}
                >
                  Max {weight} pts
                </span>

                {/* Percentage pill */}
                <span
                  style={{
                    flexShrink:   0,
                    fontSize:     12,
                    fontWeight:   800,
                    color:        primary,
                    background:   `${primary}0d`,
                    border:       `1px solid ${primary}22`,
                    borderRadius: 999,
                    padding:      '3px 10px',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace:   'nowrap',
                  }}
                >
                  {weight}%
                </span>
              </div>

              {/* Segmented animated bar */}
              <div
                style={{
                  position:    'relative',
                  width:       '100%',
                  height:      8,
                  borderRadius: 999,
                  overflow:    'hidden',
                  background:  `${primary}0f`,
                  backgroundImage:
                    `repeating-linear-gradient(90deg, ` +
                    `${primary}0a 0, ${primary}0a 8px, transparent 8px, transparent 14px)`,
                }}
              >
                <div
                  className="ci-bar-fill"
                  style={{
                    height:        '100%',
                    width:         `${Math.min(weight, 100)}%`,
                    borderRadius:  999,
                    background:    `linear-gradient(90deg, ${primary}, ${secondary})`,
                    boxShadow:     `0 0 10px ${secondary}55`,
                    position:      'relative',
                  }}
                >
                  <span
                    style={{
                      position:  'absolute',
                      right:     3,
                      top:       '50%',
                      transform: 'translateY(-50%)',
                      width:     4,
                      height:    4,
                      borderRadius: '50%',
                      background: '#fff',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer summary ───────────────────────────────────────────── */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          gap:            12,
          padding:        '12px 20px',
          borderTop:      `1px solid ${primary}10`,
          background:     `${primary}05`,
        }}
      >
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af' }}>
            Total Weight
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#191c1e', fontVariantNumeric: 'tabular-nums' }}>
            {roundedTotal}%
          </div>
        </div>

        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          7,
            fontSize:     12,
            fontWeight:   700,
            padding:      '8px 14px',
            borderRadius: 999,
            background:   ready ? `${secondary}12` : '#fffbeb',
            border:       `1px solid ${ready ? `${secondary}30` : '#fcd34d55'}`,
            color:        ready ? secondary : '#b45309',
          }}
        >
          {ready ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {ready
            ? 'Ready for Judging'
            : `Add ${Math.max(0, 100 - roundedTotal)}% more`}
        </div>
      </div>
    </div>
  );
}