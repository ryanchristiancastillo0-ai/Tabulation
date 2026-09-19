import { useEffect } from 'react';
import { Info, X } from 'lucide-react';

// Reusable modal that shows a short explanation + optional sample table.
// Used by the calculation type "See More" buttons in the admin sections.
const ExplanationModal = ({ open, onClose, title, description, table }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const renderCell = (cell) => {
    if (cell && typeof cell === 'object') return cell.v;
    return cell;
  };

  const isHighlighted = (cell) => !!(cell && typeof cell === 'object' && cell.highlight);

  const bodyStyle = {
    fontSize: 12,
    color: 'var(--text2)',
    lineHeight: 1.6,
    margin: 0,
  };

  const thStyle = {
    textAlign: 'center',
    padding: '7px 8px',
    borderBottom: '2px solid var(--border)',
    color: 'var(--text3)',
    fontWeight: 700,
    fontSize: 12,
  };

  const tdStyle = (cell, j) => {
    const hl = isHighlighted(cell);
    return {
      textAlign: j === 0 ? 'left' : 'center',
      padding: '7px 8px',
      borderBottom: '1px solid var(--border)',
      background: hl ? 'var(--accent-lt)' : 'transparent',
      color: hl ? 'var(--accent)' : 'var(--text1)',
      fontWeight: hl ? 700 : 400,
      fontSize: 12,
      fontFamily: 'var(--font-mono)',
    };
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#14201A]/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-[var(--surface)] shadow-2xl transition-all border border-[var(--border)]" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--accent-lt)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Info size={15} />
          </div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--accent)', fontFamily: 'inherit' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, fontFamily: 'inherit' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {description && (
            <div style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)' }}>
              <p style={{ ...bodyStyle, color: 'var(--text1)' }}>{description}</p>
            </div>
          )}

          {table && (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {table.headers.map((h, i) => (
                      <th key={i} style={{ ...thStyle, textAlign: i === 0 ? 'left' : 'center' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} style={tdStyle(cell, j)}>{renderCell(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              alignSelf: 'flex-end',
              padding: '8px 18px',
              borderRadius: 5,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .2s',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplanationModal;