export default function Hero({ judgeId, compType, contestName, onRefresh }) {
  return (
    <div className="relative overflow-hidden rounded-2xl mb-6 sm:mb-12">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/img/backgroundAdmin.png')" }}
      />
      {/* Dark overlay so text stays readable regardless of image */}
      <div className="absolute inset-0 bg-[#191c1e]/80" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 p-5 sm:p-8 md:p-10">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-white/15 text-white text-[9px] sm:text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-widest">
              Judge #{judgeId}
            </span>
            <span className={`text-[9px] sm:text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-widest ${
              compType === 'rank'
                ? 'bg-orange-100 text-orange-600'
                : 'bg-[#10b981]/20 text-[#6ee7b7]'
            }`}>
              {compType === 'rank' ? 'Rank-Sum System' : 'Average System'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-white leading-none">
            Live <span className="text-[#6ee7b7] italic">Standings</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/70 mt-2 font-medium truncate">{contestName}</p>
        </div>

        <button
          onClick={onRefresh}
          className="bg-[#10b981] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold hover:opacity-90 transition-all self-start md:self-auto shrink-0"
        >
          ↻ Refresh
        </button>
      </div>
    </div>
  );
}