

export default function CriteriaHeader({ criteria, primary, secondary }) {
  if (!criteria?.length) return null;

  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.percentage ?? 0), 0);

  return (
    <div
      className="w-full rounded-xl sm:rounded-2xl mb-4 sm:mb-7 overflow-hidden"
      style={{
        background: '#fff',
        border:     `1px solid ${primary}20`,
        boxShadow:  `0 2px 12px ${primary}0d`,
      }}
    >
      {/* Title row — centered */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',   /* ← FIX: was space-between, now center */
          gap:            12,
          padding:        '12px 28px',
          borderBottom:   `1px solid ${primary}12`,
          background:     `linear-gradient(90deg, ${primary}0a, #fff)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width:     6,
              height:    6,
              borderRadius: '50%',
              background:   secondary,
              boxShadow:    `0 0 0 3px ${secondary}30`,
              flexShrink:   0,
            }}
          />
          <span
            style={{
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color:         '#3c4a42',
            }}
          >
            Scoring Criteria
          </span>
        </div>

        <span
          style={{
            fontSize:   11,
            fontWeight: 700,
            color:      totalWeight === 100 ? '#6b7280' : '#dc2626',
          }}
        >
         {Math.round(totalWeight)}% total
        </span>
      </div>

      {/* Criteria rows */}
      <div style={{ padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {criteria.map((c, i) => {
          const weight = Number(c.percentage ?? 0);
          return (
            <div key={c.id ?? i}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#191c1e' }}>
                  {c.name}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: primary, fontVariantNumeric: 'tabular-nums' }}>
                   {Math.round(weight)}%
                </span>
              </div>
              <div
                style={{
                  width:        '100%',
                  height:       6,
                  borderRadius: 999,
                  overflow:     'hidden',
                  background:   `${primary}14`,
                }}
              >
                <div
                  style={{
                    height:     '100%',
                    width:      `${Math.min(weight, 100)}%`,
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${primary}, ${secondary})`,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}