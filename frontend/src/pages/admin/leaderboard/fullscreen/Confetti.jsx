import { CONFETTI_COLORS } from './constants.jsx';

// Fixed piece layout generated once at module load — keeps the burst stable
// across re-renders while still being random per page view.
const CONFETTI_PIECES = Array.from({ length: 45 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 1.2,
  duration: 2.6 + Math.random() * 1.6,
  size: 6 + Math.random() * 6,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  rotate: Math.random() * 360,
  drift: (Math.random() - 0.5) * 120,
}));

/**
 * Pure CSS confetti burst — a handful of small rectangles that fall + spin
 * from the top of the podium area. No external library required.
 */
export default function Confetti({ active }) {
  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translate(0, -20px) rotate(0deg); opacity: 0; }
          8%   { opacity: 1; }
          100% { transform: translate(var(--drift), 340px) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {CONFETTI_PIECES.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            borderRadius: 1,
            '--drift': `${p.drift}px`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}