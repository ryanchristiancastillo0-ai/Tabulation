import {
  AlertCircle,
  X, 
} from 'lucide-react';
export default function ErrorModal({ message, onClose }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999] p-6 bg-black/40 flex items-center justify-center animate-[fadeIn_.15s_ease]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-rose-200 p-10 max-w-sm w-full text-center shadow-2xl animate-[slideUp_.2s_ease]"
      >
        <div className="w-15 h-15 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center mx-auto mb-5">
          <AlertCircle size={26} className="text-red-600" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 mb-2">Registration Failed</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border-none bg-red-600 hover:bg-red-700 text-white text-sm font-bold cursor-pointer font-[inherit] flex items-center justify-center gap-2 transition-colors duration-150"
        >
          <X size={15} /> Dismiss
        </button>
      </div>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}