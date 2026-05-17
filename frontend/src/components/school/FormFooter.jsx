import {
 Loader,  ChevronRight

} from 'lucide-react';
export default function FormFooter({ status, onSubmit }) {
  return (
    <div className="px-9 py-6 bg-slate-50 flex items-center justify-between gap-4">
      <span className="text-xs text-slate-400">Fields marked * are required</span>
      <button
        onClick={onSubmit}
        disabled={status === 'saving'}
        className={[
          'inline-flex items-center gap-2 px-7 py-3 rounded-xl border-none text-white text-sm font-bold font-[inherit] transition-all duration-150 shrink-0',
          status === 'saving'
            ? 'bg-slate-400 cursor-not-allowed shadow-none'
            : 'bg-emerald-400 hover:bg-emerald-600 cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.3)]',
        ].join(' ')}
      >
        {status === 'saving' ? (
          <><Loader size={15} className="animate-spin" /> Creating…</>
        ) : (
          <>Create School <ChevronRight size={15} /></>
        )}
      </button>
    </div>
  );
}