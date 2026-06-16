export default function EncryptedBadge({ secondary }) {
  return (
    <div className="flex items-center gap-2 opacity-45">
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: secondary, animation: 'pulse 2s infinite' }}
      />
      <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#3c4a42]">
        Encrypted Connection Active
      </span>
    </div>
  );
}