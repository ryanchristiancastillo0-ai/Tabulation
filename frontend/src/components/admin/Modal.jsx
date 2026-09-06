import { AlertTriangle, Info, X } from 'lucide-react';

export const Modal = ({ isOpen, title, message, onConfirm, onCancel, type = 'danger' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#14201A]/60 backdrop-blur-sm transition-opacity" onClick={onCancel} />
      <div className="relative w-full max-w-md transform overflow-hidden rounded-sm bg-[var(--surface)] p-6 shadow-2xl transition-all border border-[var(--border)] animate-in fade-in zoom-in duration-200">
        <button onClick={onCancel} className="absolute right-4 top-4 text-[var(--text3)] hover:text-[var(--text1)] transition-colors">
          <X size={20} />
        </button>
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-sm ${type === 'danger' ? 'bg-[var(--red-lt)] text-[var(--red)]' : 'bg-[var(--accent-lt)] text-[var(--accent)]'}`}>
            {type === 'danger' ? <AlertTriangle size={24} /> : <Info size={24} />}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-[var(--text1)] leading-6 heading-serif">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text2)]">{message}</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 text-sm font-semibold text-[var(--text2)] bg-[var(--surface2)] border border-[var(--border)] rounded-sm hover:bg-[var(--border)] transition-all active:scale-95">
            Cancel
          </button>
          <button onClick={onConfirm} className={`px-5 py-2.5 text-sm font-semibold text-white rounded-sm shadow-md transition-all active:scale-95 ${type === 'danger' ? 'bg-[var(--red)] hover:opacity-90' : 'bg-[var(--accent)] hover:bg-[var(--accent-mid)]'}`}>
            {type === 'danger' ? 'Confirm Reset' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};