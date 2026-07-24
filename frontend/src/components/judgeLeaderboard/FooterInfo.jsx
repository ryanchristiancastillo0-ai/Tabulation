export default 
function FooterInfo({ compType }) {
  return (
    <div className="p-4 sm:p-6 bg-white border border-[#bbcabf] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
      <div>
        <span className="text-[9px] sm:text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest block mb-1">
          Computation Rule
        </span>
        <span className="text-xs font-semibold text-[#3c4a42]">
          {compType === 'rank'
            ? 'Rank-Sum: Each judge ranks contestants by total. Lowest rank sum wins.'
            : 'Average System: Higher percentage = better performance.'}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse" />
        <span className="text-[10px] font-bold text-[#3c4a42] uppercase tracking-widest">
          Synchronized
        </span>
      </div>
    </div>
  );
}