import { AlertTriangle, Info, X } from 'lucide-react';

export const Modal = ({ isOpen, title, message, onConfirm, onCancel, type = 'danger' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onCancel} />
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all border border-slate-100 animate-in fade-in zoom-in duration-200">
        <button onClick={onCancel} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={20} />
        </button>
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full ${type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            {type === 'danger' ? <AlertTriangle size={24} /> : <Info size={24} />}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 leading-6">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">{message}</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95">
            Cancel
          </button>
          <button onClick={onConfirm} className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all active:scale-95 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
            {type === 'danger' ? 'Confirm Reset' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};