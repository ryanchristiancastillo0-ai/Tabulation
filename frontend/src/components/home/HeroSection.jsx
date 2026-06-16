export default function HeroSection({ navigate }) {
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }

        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.25s; }
        .delay-3 { animation-delay: 0.4s; }
        .delay-4 { animation-delay: 0.55s; }
      `}</style>

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/img/background.png"
          alt="Academic Innovation"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(247, 249, 251, 0.35)', backdropFilter: 'blur(8px)' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-20 md:py-24">
        <div className="max-w-3xl">
          <span className="animate-fade-in-up delay-1 inline-block px-3 py-1 bg-[#10b981]/10 text-[#006c49] text-xs font-semibold rounded-full mb-4 sm:mb-6 uppercase tracking-widest">
            Competition Portal
          </span>

          <h1 className="animate-fade-in-up delay-2 text-3xl sm:text-4xl md:text-6xl font-extrabold text-[#191c1e] mb-4 sm:mb-6 leading-tight tracking-tight">
            Professional Online Judging Platform{' '}
            <span className="text-[#006c49] block sm:inline">for Schools & Competitions</span>
          </h1>

          <p className="animate-fade-in-up delay-3 text-base sm:text-lg text-[#3c4a42] mb-8 sm:mb-10 max-w-2xl leading-relaxed">
            Create your school's judging workspace, manage judges, contestants, and scoring in real time.
          </p>

          <div className="animate-fade-in-up delay-4 flex flex-wrap gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/school')}
              className="bg-[#10b981] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all"
            >
              Create School Account
              <span className="text-base sm:text-lg leading-none">→</span>
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-white border border-[#bbcabf] text-[#545f73] px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-xs sm:text-sm font-bold hover:bg-[#f2f4f6] transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}