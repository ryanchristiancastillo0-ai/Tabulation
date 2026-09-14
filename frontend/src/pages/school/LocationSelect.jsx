import {
  Loader,
  ChevronDown,
} from 'lucide-react';
import {Field,inputCls} from './index'
export default function LocationSelect({ label, icon: Icon, value, onChange, options, loading, disabled, placeholder, error }) {
  return (
    <Field label={label} icon={Icon} error={error}>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled || loading}
          className={[
            inputCls(error),
            'appearance-none pr-9 cursor-pointer',
            (disabled || loading) ? 'cursor-not-allowed opacity-55' : '',
            !value ? 'text-slate-400' : 'text-slate-900',
          ].join(' ')}
        >
          <option value="">{loading ? 'Loading…' : placeholder}</option>
          {options.map((opt) => (
            <option key={opt.code} value={opt.code}>{opt.name}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center">
          {loading ? <Loader size={14} className="animate-spin" /> : <ChevronDown size={14} />}
        </div>
      </div>
    </Field>
  );
}
