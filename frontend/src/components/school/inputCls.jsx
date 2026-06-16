 const inputCls = (hasError) =>
  [
    'w-full px-3.5 py-2.5 rounded-xl outline-none text-sm text-slate-900 font-[inherit] transition-all duration-150',
    'border bg-white',
    hasError
      ? 'border-red-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
      : 'border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100',
  ].join(' ');

  export default inputCls
