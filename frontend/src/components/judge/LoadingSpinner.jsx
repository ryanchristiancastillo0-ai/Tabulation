export default function LoadingSpinner({ secondary }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-4 opacity-50">
      <div
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-[3px]"
        style={{
          borderColor:    secondary,
          borderTopColor: 'transparent',
          animation:      'spin 0.8s linear infinite',
        }}
      />
      <p className="font-mono text-xs tracking-[0.18em] uppercase text-[#3c4a42]">
        Building Interface…
      </p>
    </div>
  );
}
