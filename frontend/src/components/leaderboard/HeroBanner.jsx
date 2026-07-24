export default function HeroBanner({ contestName, isRankMode }) {
  return (
    <div className="relative overflow-hidden px-4 sm:px-8 lg:px-12 py-7 sm:py-10">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/img/backgroundAdmin.png')" }}
      />

      {/* Gradient overlay — tints the image and keeps text readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#006c49]/50 to-[#10b981]/50" />

      {/* Content */}
      <div className="relative z-10">
        <span className="inline-block bg-white/20 text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest mb-2 sm:mb-3">
          Competition Portal
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-1">
          {contestName || 'Competition Results'}
        </h1>
        <p className="text-white/75 text-xs sm:text-sm">
          {isRankMode ? 'Rank-Based Scoring · Admin View' : 'Average-Based Scoring · Admin View'}
        </p>
      </div>
    </div>
  );
}