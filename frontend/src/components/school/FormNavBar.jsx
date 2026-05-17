import {
 ArrowLeft

} from 'lucide-react';
export default function FormNavBar({ navigate }) {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-12 flex items-center justify-between" style={{ height: 68 }}>
        <div className="flex items-center gap-2">
           <img
            src="/img/USAL_LOGO.png"
            alt="Veridict Logo"
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain flex-shrink-0"
          />
        <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">Veridict</div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 bg-transparent border-none cursor-pointer font-[inherit] hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Home
        </button>
      </div>
      <div className="h-0.5 bg-gradient-to-r from-emerald-700 to-emerald-400" />
    </nav>
  );
}
