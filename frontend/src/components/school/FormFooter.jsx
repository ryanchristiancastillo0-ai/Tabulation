import { Loader, ChevronRight } from 'lucide-react';

export default function FormFooter({ status, onSubmit }) {
  return (
    <div className="px-4 sm:px-9 py-4 sm:py-6 bg-[#F3F6F1] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
      <span className="text-[10px] sm:text-xs text-[#8FA192] text-center sm:text-left">
        Fields marked * are required
      </span>
      <button
        onClick={onSubmit}
        disabled={status === 'saving'}
        className={[
          'inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3 rounded-sm border-none text-white text-sm font-bold font-[inherit] transition-all duration-150 shrink-0 tracking-wide',
          status === 'saving'
            ? 'bg-[#8FA192] cursor-not-allowed'
            : 'bg-[#1B4332] hover:bg-[#123024] cursor-pointer',
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