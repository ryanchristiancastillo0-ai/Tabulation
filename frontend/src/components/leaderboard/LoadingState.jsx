
import {NavBar} from './index'
export default function LoadingState() {
  return (
    <div className="bg-[#f7f9fb] min-h-screen font-['Inter',sans-serif]">
      <NavBar />
      <div className="flex items-center justify-center h-64 text-[#6b7280] text-sm">
        Fetching results…
      </div>
    </div>
  );
}