
import {NavBar} from './index'
export default function LoadingState() {
  return (
    <div className="bg-[var(--bg)] min-h-screen font-['Inter',sans-serif]">
      <NavBar />
      <div className="flex items-center justify-center h-64 text-[var(--text3)] text-sm">
        Fetching results…
      </div>
    </div>
  );
}