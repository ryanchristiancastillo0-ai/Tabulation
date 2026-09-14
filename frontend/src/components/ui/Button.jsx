/**
 * Reusable button that maps to the app's existing button styles
 * (btn-primary / btn-ghost from index.css) plus a couple of local variants.
 */
export default function Button({
  variant = 'primary',
  full = false,
  loading = false,
  loadingText,
  className = '',
  children,
  ...rest
}) {
  const base = {
    primary: 'btn-primary flex items-center justify-center gap-2 text-sm',
    ghost: 'btn-ghost flex items-center justify-center gap-2 text-sm',
    danger:
      'flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-xs font-semibold border border-[#fecdd3] bg-[var(--red-lt)] text-[var(--red)] hover:bg-red-100 transition-colors',
    outline:
      'flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-xs font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text2)] hover:bg-[var(--surface2)] transition-colors',
  }[variant];

  return (
    <button
      className={`${base} ${full ? 'w-full' : ''} ${loading ? 'opacity-70 pointer-events-none' : ''} ${className}`}
      {...rest}
    >
      {loading ? (loadingText ?? 'Loading…') : children}
    </button>
  );
}