import { AlertTriangle } from 'lucide-react';

/**
 * Inline error panel with an optional retry action.
 */
export default function ErrorMessage({
  message,
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-12 ${className}`}>
      <div className="w-12 h-12 rounded-sm bg-[var(--red-lt)] text-[var(--red)] flex items-center justify-center mb-4">
        <AlertTriangle size={22} />
      </div>
      <div className="text-sm font-bold text-[var(--red)]">Something went wrong</div>
      {message && <p className="text-xs text-[var(--text3)] mt-1.5 max-w-sm">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text1)] hover:bg-[var(--surface2)] transition-colors"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}