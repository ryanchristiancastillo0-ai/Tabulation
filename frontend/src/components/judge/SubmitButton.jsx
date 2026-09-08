export default function SubmitButton({ onClick, disabled, primary, complete = true }) {
  const unfinished = !complete && !disabled;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full sm:w-auto rounded-sm text-sm font-extrabold tracking-widest uppercase transition-all border-none"
        style={{
          fontFamily:  'inherit',
          padding:     '12px 40px',
          maxWidth:    '360px',
          background:  disabled ? '#E1E8DE' : unfinished ? primary : primary,
          color:       disabled ? '#9ca3af' : '#fff',
          cursor:      disabled ? 'not-allowed' : 'pointer',
          boxShadow:   disabled ? 'none' : unfinished ? `0 0 0 2px #E8B931, 0 6px 20px ${primary}40` : `0 6px 20px ${primary}40`,
          filter:      unfinished ? 'grayscale(0.65) brightness(0.85)' : 'none',
        }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = unfinished ? 'grayscale(0.4) brightness(0.95)' : 'brightness(0.88)'; }}
        onMouseLeave={e => { e.currentTarget.style.filter = unfinished ? 'grayscale(0.65) brightness(0.85)' : 'none'; }}
      >
        Submit Scores
      </button>
      {unfinished && (
        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600">
          Complete all scores to submit
        </span>
      )}
    </div>
  );
}