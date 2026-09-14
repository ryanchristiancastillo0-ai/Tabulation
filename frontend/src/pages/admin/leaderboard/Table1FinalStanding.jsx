import {SectionLabel,ExportButton,FullscreenIcon, getMedalClass} from './index'
import { formatRank } from '../../../utils/ranks'
import Table from '../../../components/ui/Table'

export default function Table1FinalStandings({ standings, isRankMode, onFullscreen, onCSV, onPNG, onXLSX }) {
  const columns = [
    {
      key: 'rank',
      header: 'Rank',
      headerClass: 'px-3 sm:px-6 py-3 sm:py-4 text-center w-14 sm:w-20',
      cellClass: 'px-3 sm:px-6 py-3 sm:py-5 text-center',
      render: (c, idx) => (
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-sm flex items-center justify-center font-bold text-xs sm:text-sm mx-auto ${getMedalClass(idx)}`}>
          {formatRank(c.rank ?? idx + 1)}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Contestant',
      headerClass: 'px-3 sm:px-6 py-3 sm:py-4 text-left',
      cellClass: 'px-3 sm:px-6 py-3 sm:py-5',
      render: (c, idx) => (
        <div>
          <div className="font-bold text-[var(--text1)] text-sm sm:text-lg leading-tight">{c.name}</div>
          {idx === 0 && (
            <div className="text-[9px] sm:text-[10px] font-bold text-[var(--amber)] uppercase tracking-wider mt-0.5">
              🏆 Current Leader
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'score',
      header: isRankMode ? 'Rank Sum' : 'Final Average',
      headerClass: 'px-3 sm:px-6 py-3 sm:py-4 text-right',
      cellClass: 'px-3 sm:px-6 py-3 sm:py-5 text-right',
      render: (c, idx) => (
        <span className={`font-mono font-black text-lg sm:text-2xl ${idx === 0 ? 'text-[var(--accent-mid)]' : 'text-[var(--text1)]'}`}>
          {isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <SectionLabel number="01" label="Official Final Standings" />
        <div className="flex items-center gap-2 shrink-0">
          <ExportButton
            onExport={(key) => {
              if (key === 'csv') onCSV?.();
              else if (key === 'png') onPNG?.();
              else if (key === 'xlsx') onXLSX?.();
            }}
          />
          <button
            onClick={onFullscreen}
            className="flex items-center gap-1.5 bg-[var(--accent)] text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-sm hover:opacity-90 transition-all"
          >
            <FullscreenIcon />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>
      </div>

      <Table
        id="table-standings"
        columns={columns}
        rows={standings}
        rowKey={(c) => c.name}
        minWidth="300px"
        emptyMessage="No scores submitted yet."
        rowClassName={(c, idx) => (idx === 0 ? 'bg-[var(--amber-lt)] hover:bg-[var(--amber-lt)]' : '')}
        banner={
          <div className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-mid)] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-wrap gap-2">
            <span className="text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
              {standings.length} Contestant{standings.length !== 1 ? 's' : ''}
            </span>
            <span className="text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
              {isRankMode ? 'Lower rank sum wins' : 'Higher score wins'}
            </span>
          </div>
        }
      />
    </section>
  );
}