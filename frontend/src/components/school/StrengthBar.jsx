export default function StrengthBar({ pw }) {
  if (!pw) return null;
  const checks = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)];
  const score = checks.filter(Boolean).length;
  const colorMap = { 0: 'bg-slate-200', 1: 'bg-red-500', 2: 'bg-amber-400', 3: 'bg-emerald-400', 4: 'bg-emerald-700' };
  const labelMap = { 0: '', 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' };
  const textMap  = { 0: '', 1: 'text-red-600', 2: 'text-amber-500', 3: 'text-emerald-500', 4: 'text-emerald-700' };
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={['flex-1 h-0.5 rounded-full transition-all duration-200', i <= score ? colorMap[score] : 'bg-slate-200'].join(' ')}
          />
        ))}
      </div>
      <span className={`text-xs font-semibold ${textMap[score]}`}>{labelMap[score]}</span>
    </div>
  );
}