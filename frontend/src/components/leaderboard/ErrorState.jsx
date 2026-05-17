import {NavBar} from './index'
export default function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-[#f7f9fb] min-h-screen font-['Inter',sans-serif]">
      <NavBar />
      <div className="flex flex-col items-center justify-center h-64 gap-3 px-4 text-center">
        <p className="text-red-500 font-semibold text-sm">{message}</p>
        <button
          onClick={onRetry}
          className="bg-[#006c49] text-white px-6 py-2 rounded-full font-bold text-sm hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}