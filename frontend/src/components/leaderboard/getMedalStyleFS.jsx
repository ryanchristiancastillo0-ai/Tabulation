export default function getMedalStyleFS(idx) {
  if (idx === 0) return { background: '#f59e0b', color: '#fff' };
  if (idx === 1) return { background: '#94a3b8', color: '#fff' };
  if (idx === 2) return { background: '#f97316', color: '#fff' };
  return { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' };
}