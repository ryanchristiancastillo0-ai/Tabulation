
export default function CardHeaderStrip({ primary, secondary, selectedJudge }) {
  return (
    <div
      className="flex items-center justify-between px-4 sm:px-7 py-3 sm:py-4"
      style={{
        borderBottom: `1px solid ${primary}15`,
        background:   `linear-gradient(90deg, ${primary}12, #fff)`,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: secondary,
            boxShadow:  `0 0 0 4px ${secondary}30`,
            animation:  'pulse 2s infinite',
          }}
        />
        <span className="text-xs font-bold tracking-widest uppercase text-[#3c4a42]">
          Scoring Terminal
        </span>
      </div>
      {selectedJudge && (
        <span
          className="text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full tracking-wide whitespace-nowrap"
          style={{ background: `${primary}15`, color: primary }}
        >
          Judge {selectedJudge}
        </span>
      )}
    </div>
  );
}