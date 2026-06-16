


export default function SubmitButton({ onClick, disabled, primary }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full sm:w-auto rounded-xl text-sm font-extrabold tracking-widest uppercase transition-all border-none"
      style={{
        fontFamily:  'inherit',
        padding:     '12px 40px',
        maxWidth:    '360px',
        background:  disabled ? '#e0e3e5' : primary,
        color:       disabled ? '#9ca3af' : '#fff',
        cursor:      disabled ? 'not-allowed' : 'pointer',
        boxShadow:   disabled ? 'none' : `0 6px 20px ${primary}40`,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = 'brightness(0.88)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
    >
      Submit Scores
    </button>
  );
}