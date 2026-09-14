/**
 * Labeled input built on the app's .field-label / .field-input styles.
 */
export default function Input({
  label,
  hint,
  error,
  className = '',
  ...rest
}) {
  return (
    <div className={className}>
      {label && <div className="field-label">{label}</div>}
      <input className="field-input" {...rest} />
      {(error || hint) && (
        <p className={`text-[10px] mt-1 ${error ? 'text-[var(--red)]' : 'text-[var(--text3)]'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}