import { STAGE_DEPTH } from './constants.jsx';

/**
 * A single podium stage block rendered as a fake 3D cuboid.
 * Built from three faces (front / top / right side) using the classic
 * CSS "skew" isometric-cube technique — no WebGL, no libraries.
 * Front face keeps the rank number upright and readable; top/side
 * faces reuse the same background but are lightened/darkened with a
 * CSS filter to fake a light source falling from above-left.
 */
export default function StageBlock({ height, isFirst, accentColor, textColor, rank }) {
  const faceBg = isFirst
    ? `linear-gradient(180deg, ${accentColor}55, ${accentColor}20)`
    : 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))';

  const borderColor = isFirst ? accentColor : 'rgba(255,255,255,0.18)';

  return (
    <div
      className="relative w-full"
      style={{ height, marginRight: STAGE_DEPTH, marginBottom: 4 }}
    >
      {/* Ground shadow for grounding the block visually */}
      <div
        className="absolute left-1 right-[-8px] -bottom-2 h-2 rounded-full blur-sm"
        style={{ background: 'rgba(0,0,0,0.35)' }}
      />

      {/* Right side face (darker — shadow side) */}
      <div
        className="absolute top-0"
        style={{
          left: '100%',
          width: STAGE_DEPTH,
          height,
          background: faceBg,
          borderTop: `2px solid ${borderColor}`,
          filter: 'brightness(0.45) saturate(1.1)',
          transform: 'skewY(-45deg)',
          transformOrigin: 'top left',
        }}
      />

      {/* Top face (lighter — catches the light) */}
      <div
        className="absolute left-0 w-full"
        style={{
          top: -STAGE_DEPTH,
          height: STAGE_DEPTH,
          background: faceBg,
          filter: 'brightness(1.5)',
          transform: 'skewX(-45deg)',
          transformOrigin: 'bottom left',
        }}
      />

      {/* Front face */}
      <div
        className="relative w-full h-full flex items-start justify-center pt-3 rounded-[1px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        style={{
          background: faceBg,
          borderTop: `2px solid ${borderColor}`,
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span
          className="text-3xl sm:text-4xl font-black drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]"
          style={{ color: isFirst ? accentColor : textColor, opacity: isFirst ? 1 : 0.5 }}
        >
          {rank}
        </span>
      </div>
    </div>
  );
}