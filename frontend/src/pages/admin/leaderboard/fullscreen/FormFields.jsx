import { useState } from 'react';
import useDebounced from './useDebounced';

export function ColorField({ label, value, onChange }) {
  const [local, setLocal] = useState(value);
  const debounced = useDebounced(onChange);

  const handleChange = (e) => {
    setLocal(e.target.value);
    debounced(e.target.value);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={local}
          onChange={handleChange}
          className="w-8 h-8 rounded-sm cursor-pointer border-0 bg-transparent"
        />
        <span className="text-xs font-mono text-white/50">{local}</span>
      </div>
    </div>
  );
}

export function TextField({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white/10 border border-white/15 text-white text-xs font-medium px-3 py-2 rounded-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 w-full"
      />
    </div>
  );
}