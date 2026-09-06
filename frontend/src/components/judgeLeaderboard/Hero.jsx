export default function Hero({ judgeId, compType, contestName, onRefresh }) {
  return (
    <div className="relative overflow-hidden rounded-sm mb-6 sm:mb-12">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/img/backgroundAdmin.png')" }}
      />
      {/* Dark overlay so text stays readable regardless of image */}
      <div className="absolute inset-0 bg-[#14201A]/80" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 p-5 sm:p-8 md:p-10">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-white/15 text-white text-[9px] sm:text-[10px] font-bold px-3 py-1 rounded-sm uppercase tracking-widest">
              Judge #{judgeId}
            </span>
            <span className={`text-[9px] sm:text-[10px] font-bold px-3 py-1 rounded-sm uppercase tracking-widest ${
              compType === 'rank'
                ? 'bg-orange-100 text-orange-600'
                : 'bg-[#2D6A4F]/20 text-[#6ee7b7]'
            }`}>
              {compType === 'rank' ? 'Rank-Sum System' : 'Average System'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-white leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Live <span className="text-[#C9A227] italic">Standings</span>
          </h1>
          <div className="w-14 h-[3px] bg-[#C9A227] mt-3" />
          <p className="text-xs sm:text-sm text-white/70 mt-2 font-medium truncate">{contestName}</p>
        </div>

        <button
          onClick={onRefresh}
          className="bg-[#C9A227] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-sm text-xs sm:text-sm font-bold hover:opacity-90 transition-all self-start md:self-auto shrink-0"
        >
          ↻ Refresh
        </button>
      </div>
    </div>
  );
}