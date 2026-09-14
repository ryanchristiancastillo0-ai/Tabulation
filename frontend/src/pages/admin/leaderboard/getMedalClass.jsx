export default function getMedalClass(idx) {
  if (idx === 0) return 'bg-amber-400 text-white';
  if (idx === 1) return 'bg-slate-400 text-white';
  if (idx === 2) return 'bg-orange-400 text-white';
  return 'bg-slate-100 text-slate-400';
}
