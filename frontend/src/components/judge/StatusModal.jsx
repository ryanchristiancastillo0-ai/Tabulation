import { CheckCircle2, AlertCircle, XCircle, ArrowRight } from 'lucide-react';
export const StatusModal = ({ isOpen, title, message, type, onClose }) => {
  if (!isOpen) return null;
  const themes = {
    success: { icon: <CheckCircle2 className="text-emerald-500" size={44} />, btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200", accent: "border-emerald-100 bg-emerald-50/50" },
    error: { icon: <XCircle className="text-rose-500" size={44} />, btn: "bg-rose-600 hover:bg-rose-700 shadow-rose-200", accent: "border-rose-100 bg-rose-50/50" },
    warning: { icon: <AlertCircle className="text-amber-500" size={44} />, btn: "bg-amber-600 hover:bg-amber-700 shadow-amber-200", accent: "border-amber-100 bg-amber-50/50" }
  };
  const current = themes[type] || themes.success;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-xl shadow-xl overflow-hidden border border-slate-200 transform animate-in zoom-in-95 duration-200">
        <div className="p-8 flex flex-col items-center text-center">
          <div className={`mb-5 p-3 rounded-lg border ${current.accent}`}>{current.icon}</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1.5 tracking-tight">{title}</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-7">{message}</p>
          <div className="flex flex-col gap-2 w-full">
            <a href='/judge/scoreboard' className={`w-full py-2.5 text-sm text-white font-semibold rounded-md shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${current.btn}`}>
             <ArrowRight size={15}/>
              View Scoreboard
            </a>
            <button onClick={onClose} className="w-full py-2.5 text-sm text-slate-600 font-semibold rounded-md border border-slate-200 hover:bg-slate-50 transition-all active:scale-95">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};