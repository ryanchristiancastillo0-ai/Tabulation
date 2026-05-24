import { ArrowLeft } from 'lucide-react';

export default function FormNavBar({ navigate }) {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-12 flex items-center justify-between" style={{ height: 60 }}>
        
        {/* Brand */}
        <div className="flex items-center gap-2">
          <img
            src="/img/USAL_LOGO.png"
            alt="Veridict Logo"
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
          />
          <div className="text-lg sm:text-2xl font-extrabold text-emerald-700 tracking-tight">
            Veridict
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 bg-transparent border-none cursor-pointer font-[inherit] hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span className="hidden xs:inline">Back to Home</span>
          <span className="xs:hidden">Back</span>
        </button>

      </div>
      <div className="h-0.5 bg-gradient-to-r from-emerald-700 to-emerald-400" />
    </nav>
  );
}