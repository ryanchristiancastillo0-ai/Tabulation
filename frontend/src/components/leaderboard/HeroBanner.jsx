export default function HeroBanner({ contestName, isRankMode }) {
  return (
    <div className="relative overflow-hidden px-4 sm:px-8 lg:px-12 py-7 sm:py-10">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/img/hero.png')" }}
      />

      {/* Gradient overlay — tints the image and keeps text readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#123024]/80 via-[#1B4332]/60 to-[#1B4332]/40" />

      {/* Content */}
      <div className="relative z-10 w-full mx-auto max-w-[1440px] 2xl:max-w-[1920px] 3xl:max-w-[2560px] 4xl:max-w-[3200px]">
        {/* Gold rule */}
        <span className="block mb-3 w-14 h-[3px] bg-[#C9A227]" />

        <span className="inline-block bg-white/15 text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-widest mb-2 sm:mb-3 border border-white/20">
          Competition Portal
        </span>
        <h1 className="text-xl sm:text-3xl xl:text-4xl font-bold text-white tracking-tight mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {contestName || 'Competition Results'}
        </h1>
        <p className="text-white/80 text-xs sm:text-sm">
          {isRankMode ? 'Rank-Based Scoring · Admin View' : 'Average-Based Scoring · Admin View'}
        </p>
      </div>
    </div>
  );
}