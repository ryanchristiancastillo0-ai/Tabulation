export default function RefreshBar({ onRefresh, lastRefresh }) {
  return (
    <div className="text-center pt-4 pb-2">
      <button
        onClick={onRefresh}
        className="bg-[#10b981] text-white px-8 sm:px-10 py-2.5 sm:py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-sm"
      >
        ↻ Refresh Live Data
      </button>
      {lastRefresh && (
        <p className="text-[10px] sm:text-xs text-[#9ca3af] mt-2">
          Last refreshed at {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      )}
    </div>
  );
}