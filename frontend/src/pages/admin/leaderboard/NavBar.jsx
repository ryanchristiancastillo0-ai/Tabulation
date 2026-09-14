import { useNavigate } from 'react-router-dom';

export default function NavBar() {
  const navigate = useNavigate();

  return (
    <nav className="bg-[var(--bg)] sticky top-0 z-50 border-b border-[var(--border)] px-4 sm:px-8 lg:px-12 py-3 h-14 sm:h-16 flex items-center justify-between">
      <div className="w-full flex items-center justify-between px-2 sm:px-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src="/img/USAL_LOGO.png"
            alt="Logo"
            className="w-9 h-9 sm:w-11 sm:h-11 object-contain shrink-0"
          />
          <div className="hidden md:block text-lg sm:text-xl font-bold text-[var(--text1)] tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>USAL</div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Back to Dashboard Button */}
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1.5 text-[var(--text2)] hover:text-[var(--text1)] border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)] px-3 sm:px-4 py-1.5 rounded-sm text-[10px] sm:text-xs font-semibold transition-all hover:bg-[var(--accent-lt)]"
          >
            {/* Arrow icon */}
            <svg
              className="w-3 h-3 sm:w-3.5 sm:h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden xs:inline">Go Back to</span> Dashboard
          </button>

          <span className="bg-[var(--gold)] text-white text-[9px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-sm tracking-wide uppercase">
            Live Results
          </span>
        </div>
      </div>
    </nav>
  );
}