import { useNavigate } from 'react-router-dom';

export default function NavBar() {
  const navigate = useNavigate();

  return (
    <nav className="bg-[#f7f9fb] sticky top-0 z-50 border-b border-[#e0e3e5] px-4 sm:px-8 lg:px-12 py-3 h-14 sm:h-16 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-3">
        <img
          src="/img/USAL_LOGO.png"
          alt="Logo"
          className="w-9 h-9 sm:w-11 sm:h-11 object-contain shrink-0"
        />
        <div className="text-lg sm:text-xl font-bold text-[#006c49] tracking-tight">Veridict</div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Back to Dashboard Button */}
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-1.5 text-[#3c4a42] hover:text-[#006c49] border border-[#bbcabf] hover:border-[#006c49] bg-white px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all hover:bg-[#006c49]/5"
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

        <span className="bg-[#10b981] text-white text-[9px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-md tracking-wide uppercase">
          Live Results
        </span>
      </div>
    </nav>
  );
}