import { ChevronRight } from "lucide-react";



export default function ScrollHint() {
  return (
    <div className="scroll-hint">
      <ChevronRight size={10} />
      <span>Scroll to see all columns</span>
    </div>
  );
}