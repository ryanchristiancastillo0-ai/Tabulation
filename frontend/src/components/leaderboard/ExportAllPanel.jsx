import  { useState,  } from 'react';
import {DownloadIcon, CheckIcon} from './index'
export default function ExportAllPanel({ onExportAll }) {
  const [selected, setSelected] = useState({ standings: true, summary: true, judges: true });
  const [format,   setFormat]   = useState('csv');
  const [open,     setOpen]     = useState(false);

  const toggle      = (key) => setSelected(s => ({ ...s, [key]: !s[key] }));
  const anySelected = Object.values(selected).some(Boolean);
  const countSel    = Object.values(selected).filter(Boolean).length;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-sm overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-mid)] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/10 rounded-sm flex items-center justify-center shrink-0">
            <DownloadIcon size={13} />
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-sm">Export Data</div>
            <div className="text-white/50 text-[10px] hidden sm:block">Choose tables and format to download</div>
          </div>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1 shrink-0"
        >
          {open ? 'Collapse' : 'Expand'}
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {open && (
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-5">

          {/* Table + Format row */}
          <div className="flex flex-col sm:flex-row gap-5">

            {/* Table selection */}
            <div className="flex-1">
              <div className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-widest mb-3">Select Tables</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'standings', label: '01 · Final Standings' },
                  { key: 'summary',   label: '02 · Judge Summary' },
                  { key: 'judges',    label: '03 · Judge Breakdowns' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggle(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-sm border text-xs font-bold transition-all ${
                      selected[key]
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text3)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${selected[key] ? 'border-white bg-white' : 'border-current'}`}>
                      {selected[key] && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div className="sm:w-44">
              <div className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-widest mb-3">Format</div>
              <div className="flex flex-row sm:flex-col gap-2">
                {[
                  { val: 'csv', label: 'CSV Spreadsheet', badge: 'CSV', color: 'bg-[var(--accent-lt)] text-[var(--accent)]' },
                  { val: 'png', label: 'Image (PNG)',      badge: 'PNG', color: 'bg-[var(--accent-lt)] text-[var(--accent)]' },
                ].map(({ val, label, badge, color }) => (
                  <button
                    key={val}
                    onClick={() => setFormat(val)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-sm border text-xs font-semibold transition-all text-left ${
                      format === val
                        ? 'border-[var(--accent)] bg-[var(--accent-lt)] text-[var(--accent)]'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text3)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${color}`}>{badge}</span>
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{badge === 'CSV' ? 'CSV' : 'PNG'}</span>
                    {format === val && <CheckIcon size={11} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer row */}
          <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-[var(--text3)]">
              {countSel} table{countSel !== 1 ? 's' : ''} selected · {format.toUpperCase()}
            </div>
            <button
              disabled={!anySelected}
              onClick={() => onExportAll(selected, format)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all w-full sm:w-auto justify-center ${
                anySelected
                  ? 'bg-[var(--accent)] text-white hover:opacity-90 shadow-sm'
                  : 'bg-[var(--border)] text-[var(--text3)] cursor-not-allowed'
              }`}
            >
              <DownloadIcon size={13} />
              Export Selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
