import {
  AlertCircle,

} from 'lucide-react';
export default function Field({ label, icon: Icon, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold tracking-widest uppercase text-slate-600 flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-emerald-700" />}
        {label}
      </label>
      {children}
      {error && (
        <span className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={11} />
          {error}
        </span>
      )}
    </div>
  );
}