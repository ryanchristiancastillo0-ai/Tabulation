import {SectionLabel,ExportButton,getMedalClass,getOrdinal} from './index'
import { formatRank } from '../../../utils/ranks'
import Table from '../../../components/ui/Table'

export default function Table2JudgeSummary({ standings, judgeIds, isRankMode, judgeCount, getJudgeScore, getJudgeRank, onCSV, onPNG, onXLSX }) {
  const judgeColumns = judgeIds.map((judgeId) => ({
    key: `judge-${judgeId}`,
    header: (
      <div>
        <div>Judge {judgeId}</div>
        <div className="text-[9px] font-normal text-[var(--text3)] normal-case tracking-normal">
          {isRankMode ? 'Score / Rank' : 'Score'}
        </div>
      </div>
    ),
    headerClass: 'px-3 sm:px-4 py-2.5 sm:py-3 text-center min-w-[90px] sm:min-w-[110px]',
    cellClass: 'px-3 sm:px-4 py-2.5 sm:py-3 text-center',
    render: (c) => {
      const score = getJudgeScore(c.name, judgeId);
      const rankPos = getJudgeRank(c.name, judgeId);
      return score !== null ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-mono font-bold text-[var(--text1)] text-xs sm:text-sm">{score.toFixed(2)}</span>
          {isRankMode && (
            <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${rankPos === 1 ? 'bg-[var(--amber-lt)] text-[var(--amber)]' : 'bg-[var(--accent-lt)] text-[var(--accent)]'}`}>
              {formatRank(rankPos)}
            </span>
          )}
        </div>
      ) : (
        <span className="text-[var(--text3)] font-mono text-xs">—</span>
      );
    },
  }));

  const columns = [
    {
      key: 'place',
      header: 'Place',
      headerClass: 'px-3 sm:px-4 py-2.5 sm:py-3 text-center w-12 sm:w-16',
      cellClass: 'px-3 sm:px-4 py-2.5 sm:py-3 text-center',
      render: (c, idx) => (
        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-sm flex items-center justify-center font-bold text-[10px] sm:text-xs mx-auto ${getMedalClass(idx)}`}>
          {formatRank(c.rank ?? idx + 1)}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Contestant',
      headerClass: 'px-3 sm:px-4 py-2.5 sm:py-3 text-left',
      cellClass: 'px-3 sm:px-4 py-2.5 sm:py-3 font-bold text-[var(--text1)] text-xs sm:text-sm',
      value: (c) => c.name,
    },
    ...judgeColumns,
    {
      key: 'final',
      header: (
        <div>
          <div>{isRankMode ? 'Rank Sum' : 'Final Avg'}</div>
          <div className="text-[9px] font-normal text-[var(--text3)] normal-case tracking-normal">
            {isRankMode ? 'lower = better' : 'higher = better'}
          </div>
        </div>
      ),
      headerClass: 'px-3 sm:px-4 py-2.5 sm:py-3 text-right min-w-[90px] sm:min-w-[110px]',
      cellClass: 'px-3 sm:px-4 py-2.5 sm:py-3 text-right font-mono font-bold text-[var(--accent-mid)] text-xs sm:text-sm',
      render: (c) => (isRankMode ? c.total_rank : parseFloat(c.final_score).toFixed(2)),
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <SectionLabel number="02" label="Judge Summary Table" />
        <ExportButton
          onExport={(key) => {
            if (key === 'csv') onCSV?.();
            else if (key === 'png') onPNG?.();
            else if (key === 'xlsx') onXLSX?.();
          }}
        />
      </div>
      <p className="text-[10px] sm:text-xs text-[var(--text3)] mb-3 -mt-1">
        {isRankMode
          ? "Shows each judge's raw score total and the rank they give each contestant."
          : "Shows each judge's score total. Final column is the average across all judges."}
      </p>

      <Table
        id="table-summary"
        columns={columns}
        rows={standings}
        rowKey={(c) => c.name}
        minWidth={Math.max(380, 180 + Math.max(judgeIds.length, 1) * 120)}
        emptyMessage="No scores submitted yet."
        rowClassName={(c, idx) => (idx === 0 ? 'bg-[var(--amber-lt)] hover:bg-[var(--amber-lt)]' : '')}
      />
    </section>
  );
}