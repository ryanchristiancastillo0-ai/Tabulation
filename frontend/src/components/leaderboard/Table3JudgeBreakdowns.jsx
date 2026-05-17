
import {SectionLabel,ExportMenu,SingleJudgeCard} from './index'
export default function Table3JudgeBreakdowns({ judgeIds, judgeScores, onCSV, onPNG }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <SectionLabel number="03" label="Individual Judge Breakdowns" />
        <ExportMenu onCSV={onCSV} onPNG={onPNG} />
      </div>
      <div id="table-judges" className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {judgeIds.map((judgeId) => {
          const scores = [...(judgeScores[judgeId] || [])].sort((a, b) => b.total - a.total);
          return (
            <SingleJudgeCard
              key={judgeId}
              judgeId={judgeId}
              scores={scores}
            />
          );
        })}
      </div>
    </section>
  );
}