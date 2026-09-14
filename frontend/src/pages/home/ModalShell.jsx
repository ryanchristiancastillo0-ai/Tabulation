import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function ModalShell({ open, onClose, icon: Icon, title, subtitle, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0B1710]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-[#FBFCF9] rounded-sm border border-[#E1E8DE] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1B4332] px-6 sm:px-8 py-6 shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="w-10 h-[3px] bg-[#C9A227] mb-4" />
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-sm bg-white/10 border border-white/20">
                <Icon size={18} className="text-[#C9A227]" />
              </div>
            )}
            <div>
              <h3
                className="text-white text-lg sm:text-xl font-bold leading-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {title}
              </h3>
              {subtitle && (
                <p className="text-white/70 text-xs mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 sm:px-8 py-6 text-sm text-[#4B5A4D] leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}