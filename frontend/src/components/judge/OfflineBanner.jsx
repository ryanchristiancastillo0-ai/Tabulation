
import {
  WifiOff, 

} from 'lucide-react';
;
export default function OfflineBanner() {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-white text-xs font-bold tracking-widest uppercase bg-red-500 text-center flex-wrap">
      <WifiOff size={12} className="shrink-0" />
      <span>Offline — Scores will sync when reconnected</span>
    </div>
  );
}
