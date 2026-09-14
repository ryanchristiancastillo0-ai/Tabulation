import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';

export const EXPORT_FORMATS = [
  { key: 'csv',  label: 'CSV Spreadsheet', badge: 'CSV' },
  { key: 'xlsx', label: 'Excel Workbook',  badge: 'XLSX' },
  { key: 'png',  label: 'Image (PNG)',     badge: 'PNG' },
];

/**
 * Reusable dropdown export button. Hands the chosen format key back to the
 * caller via onExport(key), so it works for CSV / Excel / PNG (or any custom
 * format list).
 *
 * @param {Function}         onExport     (formatKey) => void
 * @param {Array<{key,label}>} formats     Optional override of the format list
 * @param {string}           label        Button label (default "Export")
 * @param {string|undefined} className    Extra classes for the button
 */
export default function ExportButton({
  onExport,
  formats = EXPORT_FORMATS,
  label = 'Export',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const MENU_WIDTH = 180;
  const MARGIN = 8;

  const updatePosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    // Prefer aligning the menu's right edge with the button's right edge,
    // but clamp so it never runs off either side of the viewport.
    let left = rect.right - MENU_WIDTH;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - MENU_WIDTH - MARGIN));
    setCoords({
      top: rect.bottom + 6,
      left,
    });
  };

  const toggleOpen = () => {
    updatePosition();
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  return (
    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        className={`flex items-center gap-1.5 border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--accent-lt)] text-[var(--accent)] font-bold rounded-sm transition-all text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 ${className}`}
      >
        <Download size={10} />
        {label}
        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: MENU_WIDTH,
            maxWidth: `calc(100vw - ${MARGIN * 2}px)`,
          }}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-sm shadow-xl z-50 overflow-hidden"
        >
          <div className="px-3 py-2 text-[9px] font-bold text-[var(--text3)] uppercase tracking-widest border-b border-[var(--border)]">
            Export As
          </div>
          {formats.map(({ key, label: fLabel, badge }) => (
            <button
              key={key}
              onClick={() => {
                onExport?.(key);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[var(--text1)] hover:bg-[var(--accent-lt)] transition-colors text-left"
            >
              <span className="w-7 h-7 bg-[var(--accent-lt)] text-[var(--accent)] rounded flex items-center justify-center font-bold text-[9px] shrink-0">
                {badge}
              </span>
              {fLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}