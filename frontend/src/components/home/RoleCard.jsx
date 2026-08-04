export default function RoleCard({ icon, title, desc, ctaLabel, ctaVariant, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-[#E1E8DE] p-8 sm:p-12 rounded-sm cursor-pointer flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 sm:hover:-translate-y-1 sm:hover:border-[#1B4332] sm:hover:shadow-[0px_10px_30px_rgba(27,67,50,0.08)]"
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#1B4332]" />

      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F3F6F1] border border-[#1B4332]/15 rounded-sm flex items-center justify-center mb-6 sm:mb-8 text-3xl sm:text-4xl">
        {icon}
      </div>

      <h3
        className="text-xl sm:text-2xl font-semibold text-[#14201A] mb-3"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {title}
      </h3>

      <p className="text-sm sm:text-base text-[#4B5A4D] mb-8 sm:mb-10 leading-relaxed max-w-xs">
        {desc}
      </p>

      {ctaVariant === 'filled' ? (
        <button className="w-full bg-[#1B4332] text-white py-3 sm:py-4 rounded-sm text-xs sm:text-sm font-bold hover:bg-[#123024] transition-all mt-auto tracking-wide">
          {ctaLabel}
        </button>
      ) : (
        <button className="w-full bg-white border border-[#1B4332] text-[#1B4332] py-3 sm:py-4 rounded-sm text-xs sm:text-sm font-bold hover:bg-[#1B4332]/5 transition-all mt-auto tracking-wide">
          {ctaLabel}
        </button>
      )}
    </div>
  );
}