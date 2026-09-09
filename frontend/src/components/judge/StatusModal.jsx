import { CheckCircle2, AlertCircle, XCircle, HelpCircle, ArrowRight, X } from 'lucide-react';
import { getSchoolId } from '../../utils/getSchoolId';

export default function StatusModal({ isOpen, title, message, type, onClose, onConfirm }) {
  if (!isOpen) return null;

  const isConfirm = type === 'confirm';
  const themes = {
    success: { icon: <CheckCircle2 size={40} strokeWidth={1.75} className="text-[#C9A227]" />, accent: 'bg-[#C9A227]' },
    error:   { icon: <XCircle size={40} strokeWidth={1.75} className="text-rose-400" />, accent: 'bg-rose-400' },
    warning: { icon: <AlertCircle size={40} strokeWidth={1.75} className="text-amber-400" />, accent: 'bg-amber-400' },
    confirm: { icon: <HelpCircle size={40} strokeWidth={1.75} className="text-[#C9A227]" />, accent: 'bg-[#C9A227]' },
  };
  const t = themes[type] || themes.success;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0B1710]/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel — home page theme */}
      <div className="relative w-full max-w-md bg-[#FBFCF9] rounded-sm border border-[#E1E8DE] shadow-2xl overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#1B4332] px-6 sm:px-8 py-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
          <div className={`w-10 h-[3px] ${t.accent} mb-4`} />
          <div className="flex items-center gap-3 pr-8">
            <div className="p-2 rounded-sm bg-white/10 border border-white/20 shrink-0">{t.icon}</div>
            <h3
              className="text-white text-lg sm:text-xl font-bold leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {title}
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6">
          <p className="text-sm text-[#4B5A4D] leading-relaxed">{message}</p>

          {isConfirm ? (
            <div className="mt-7 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
              <button
                onClick={onConfirm}
                className="w-full sm:flex-1 py-2.5 text-sm text-white font-semibold rounded-sm bg-[#1B4332] hover:bg-[#123024] transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                Yes, Submit
              </button>
              <button
                onClick={onClose}
                className="w-full sm:flex-1 py-2.5 text-sm text-[#1B4332] font-semibold rounded-sm border border-[#1B4332]/30 hover:bg-[#F3F6F1] transition-all active:scale-95"
              >
                No, Cancel
              </button>
            </div>
          ) : (
            <div className="mt-7 flex flex-col gap-2 w-full">
              <a
                href={`/judge/scoreboard?school_id=${getSchoolId()}`}
                className="w-full py-2.5 text-sm text-white font-semibold rounded-sm bg-[#1B4332] hover:bg-[#123024] transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2"
              >
                <ArrowRight size={15} />
                View Scoreboard
              </a>
              <button
                onClick={onClose}
                className="w-full py-2.5 text-sm text-[#4B5A4D] font-semibold rounded-sm border border-[#E1E8DE] hover:bg-[#FBFCF9] active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}