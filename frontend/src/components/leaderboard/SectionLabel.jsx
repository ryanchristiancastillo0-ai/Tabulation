export default function SectionLabel({ number, label }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-3 h-0.5 bg-[#10b981] rounded-full shrink-0" />
      <span className="text-[10px] sm:text-[11px] font-bold text-[#006c49] uppercase tracking-widest truncate">
        {number}. {label}
      </span>
    </div>
  );
}