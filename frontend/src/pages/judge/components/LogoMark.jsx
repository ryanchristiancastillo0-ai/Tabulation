
import {
   Activity

} from 'lucide-react';




export default function LogoMark({ sysConfig, size = 34 }) {
  const logoRadius  = sysConfig.logo_radius != null ? sysConfig.logo_radius : 12;
  const radiusStyle = logoRadius >= 999 ? '50%' : `${logoRadius}px`;

  if (sysConfig.school_logo) {
    return (
      <img
        src={sysConfig.school_logo}
        alt="logo"
        className="object-cover shrink-0"
        style={{
          width: size, height: size,
          borderRadius: radiusStyle,
          border: '2px solid rgba(255,255,255,0.4)',
          transition: 'border-radius .2s',
        }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size, height: size,
        borderRadius: radiusStyle,
        background: 'rgba(255,255,255,0.15)',
        border: '1.5px solid rgba(255,255,255,0.3)',
      }}
    >
      <Activity size={size * 0.47} className="text-white" />
    </div>
  );
}