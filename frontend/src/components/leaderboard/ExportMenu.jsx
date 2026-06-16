import {useEffect, useState} from 'react'
import {DownloadIcon} from './index'
export default function ExportMenu({ onCSV, onPNG }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  return (
    <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 border border-[#bbcabf] bg-white hover:bg-[#f0fdf6] text-[#006c49] font-bold rounded-lg transition-all text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2"
      >
        <DownloadIcon size={10} />
        Export
        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#e0e3e5] rounded-xl shadow-xl z-50 overflow-hidden min-w-[150px]">
          <div className="px-3 py-2 text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest border-b border-[#f0f4f2]">
            Export As
          </div>
          <button
            onClick={() => { onCSV(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[#191c1e] hover:bg-[#f0fdf6] transition-colors text-left"
          >
            <span className="w-5 h-5 bg-[#dcfce7] text-[#006c49] rounded flex items-center justify-center font-bold text-[9px] shrink-0">CSV</span>
            Export as CSV
          </button>
          <button
            onClick={() => { onPNG(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[#191c1e] hover:bg-[#f0fdf6] transition-colors text-left"
          >
            <span className="w-5 h-5 bg-[#ede9fe] text-[#7c3aed] rounded flex items-center justify-center font-bold text-[9px] shrink-0">PNG</span>
            Export as Image
          </button>
        </div>
      )}
    </div>
  );
}
