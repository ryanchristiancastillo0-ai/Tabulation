
import {
 Lock,
} from 'lucide-react';
;

export default function LockBanner({ selectedJudge }) {
  if (selectedJudge) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-amber-200 text-xs font-bold tracking-wider uppercase bg-amber-900 text-center flex-wrap">
        <Lock size={11} className="shrink-0" />
        <span>Locked in as Judge {selectedJudge} — switching disabled</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-red-300 text-xs font-bold tracking-wider uppercase bg-red-950 text-center flex-wrap">
      <Lock size={11} className="shrink-0" />
      <span>Judge switching is locked — select your judge once to begin</span>
    </div>
  );
}