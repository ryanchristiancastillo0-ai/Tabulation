/**
 * Empty-state placeholder for lists/panels that have no content yet.
 */
export default function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  message,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-12 ${className}`}>
      {Icon && (
        <div className="w-12 h-12 rounded-sm bg-[var(--surface2)] text-[var(--text3)] flex items-center justify-center mb-4">
          <Icon size={22} />
        </div>
      )}
      <div className="text-sm font-bold text-[var(--text1)]">{title}</div>
      {message && <p className="text-xs text-[var(--text3)] mt-1.5 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}