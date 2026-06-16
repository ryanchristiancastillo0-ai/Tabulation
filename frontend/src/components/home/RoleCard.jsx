export default function RoleCard({ icon, title, desc, features, ctaLabel, ctaVariant, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-[#bbcabf] p-6 sm:p-10 rounded-xl cursor-pointer flex flex-col h-full transition-all duration-300 sm:hover:-translate-y-1 sm:hover:border-[#10b981] sm:hover:shadow-[0px_10px_30px_rgba(30,41,59,0.06)]"
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#f2f4f6] rounded-lg flex items-center justify-center mb-6 sm:mb-8 text-2xl sm:text-3xl">
        {icon}
      </div>

      <h3 className="text-xl sm:text-2xl font-semibold text-[#191c1e] mb-3 sm:mb-4">{title}</h3>

      <p className="text-sm sm:text-base text-[#3c4a42] mb-6 sm:mb-8 flex-grow leading-relaxed">{desc}</p>

      <ul className="space-y-2 sm:space-y-3 mb-8 sm:mb-10">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#3c4a42] font-medium">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#006c49] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {ctaVariant === 'filled' ? (
        <button className="w-full bg-[#10b981] text-white py-3 sm:py-4 rounded-lg text-xs sm:text-sm font-bold hover:opacity-90 transition-all mt-auto">
          {ctaLabel}
        </button>
      ) : (
        <button className="w-full bg-white border border-[#006c49] text-[#006c49] py-3 sm:py-4 rounded-lg text-xs sm:text-sm font-bold hover:bg-[#006c49]/5 transition-all mt-auto">
          {ctaLabel}
        </button>
      )}
    </div>
  );
}