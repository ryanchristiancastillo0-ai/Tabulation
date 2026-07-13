import { useState } from 'react';

export default function Header({ navigate }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-[#f7f9fb] fixed top-0 left-0 right-0 z-50 border-b border-[#e0e3e5] w-full">
      <div className="flex justify-between items-center max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 h-20">
        <div className="flex items-center gap-3 text-xl sm:text-2xl font-bold text-[#006c49] tracking-tight">
          <img
            src="/img/USAL_LOGO.png"
            alt="Veridict Logo"
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain flex-shrink-0"
          />
          Veridict
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="text-base text-[#3c4a42] hover:text-[#006c49] transition-colors px-2 py-1"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/school')}
            className="bg-[#10b981] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all"
          >
            Get Started
          </button>
        </div>

        {/* Hamburger */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-[#3c4a42] hover:text-[#006c49] focus:outline-none p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#f7f9fb] border-b border-[#e0e3e5] px-4 pt-2 pb-6 space-y-3 absolute left-0 w-full shadow-lg z-40 transition-all duration-200">
          <button
            onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
            className="block w-full text-left text-base text-[#3c4a42] hover:text-[#006c49] font-medium py-2.5 border-b border-[#e0e3e5]/50"
          >
            Sign In
          </button>
          <button
            onClick={() => { navigate('/school'); setIsMenuOpen(false); }}
            className="block w-full text-center bg-[#10b981] text-white py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-sm"
          >
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
}