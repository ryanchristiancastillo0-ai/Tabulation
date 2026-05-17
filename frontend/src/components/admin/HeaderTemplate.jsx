
import {
  
  Building2,  Palette, LayoutTemplate, SlidersHorizontal,

} from 'lucide-react';

const HEADER_TEMPLATES = [
  {
    id: 'structured',
    name: 'Structured',
    desc: 'Two-row layout — branding top, contest info & judge selector bottom',
    icon: <LayoutTemplate size={18} />,
    render: ({ primary, secondary, schoolLogo, portalName, schoolName, footerText, logoRadius }) => {
      const r = logoRadius >= 999 ? '50%' : `${logoRadius}px`;
      return (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', fontFamily: 'inherit' }}>
          <div style={{ background: primary, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {schoolLogo ? (
              <img src={schoolLogo} alt="logo" style={{ width: 32, height: 32, borderRadius: r, objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.35)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: r, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.25)' }}>
                <Building2 size={14} style={{ color: '#fff' }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{portalName || 'Veridict'}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{schoolName || 'Official Judging Portal'}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: secondary, display: 'inline-block' }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.1em' }}>LIVE</span>
            </div>
          </div>
          <div style={{ height: 2, background: secondary }} />
          <div style={{ background: 'var(--surface)', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 100 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 2 }}>Active Contest</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>Sample Contest Name 2025</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)' }}>Judging As</div>
              <select style={{ appearance: 'none', padding: '5px 24px 5px 10px', background: primary, border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                <option>Select Judge…</option><option>Judge 1</option><option>Judge 2</option>
              </select>
            </div>
          </div>
          {footerText && <div style={{ background: 'var(--surface2)', padding: '4px 16px', fontSize: 10, color: 'var(--text3)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>{footerText}</div>}
        </div>
      );
    },
  },
  {
    id: 'compact',
    name: 'Compact Bar',
    desc: 'Single-row header — identity left, contest center, judge selector right',
    icon: <SlidersHorizontal size={18} />,
    render: ({ primary, secondary, schoolLogo, portalName, schoolName, footerText, logoRadius }) => {
      const r = logoRadius >= 999 ? '50%' : `${logoRadius}px`;
      return (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', fontFamily: 'inherit' }}>
          <div style={{ background: primary, padding: '0 14px', minHeight: 54, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12, borderRight: '1px solid rgba(255,255,255,0.18)', flexShrink: 0 }}>
              {schoolLogo ? <img src={schoolLogo} alt="logo" style={{ width: 28, height: 28, borderRadius: r, objectFit: 'cover' }} /> : <div style={{ width: 28, height: 28, borderRadius: r, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={12} style={{ color: '#fff' }} /></div>}
              <div>
                <div style={{ fontWeight: 800, fontSize: 11, color: '#fff', lineHeight: 1.1 }}>{portalName || 'Veridict'}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}>{schoolName || 'Judge Portal'}</div>
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', marginBottom: 1 }}>Now Judging</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Sample Contest 2025</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12, borderLeft: '1px solid rgba(255,255,255,0.18)', flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: secondary }} />
              <select style={{ appearance: 'none', padding: '6px 24px 6px 10px', background: 'rgba(255,255,255,0.14)', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 7, fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                <option style={{ background: primary }}>Select Judge…</option><option style={{ background: primary }}>Judge 1</option>
              </select>
            </div>
          </div>
          <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${secondary}, transparent)` }} />
          {footerText && <div style={{ background: 'var(--surface2)', padding: '4px 16px', fontSize: 10, color: 'var(--text3)', display: 'flex', justifyContent: 'space-between' }}><span>{footerText}</span><span style={{ opacity: 0.6 }}>Encrypted · Secure</span></div>}
        </div>
      );
    },
  },
  {
    id: 'elevated',
    name: 'Elevated Card',
    desc: 'White card style — colored top accent, contest & judge info clearly separated',
    icon: <Palette size={18} />,
    render: ({ primary, secondary, schoolLogo, portalName, schoolName, footerText, logoRadius }) => {
      const r = logoRadius >= 999 ? '50%' : `${logoRadius}px`;
      const wrapR = logoRadius >= 999 ? '50%' : `${Math.min((logoRadius || 0) + 4, 16)}px`;
      return (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', fontFamily: 'inherit' }}>
          <div style={{ height: 4, background: primary }} />
          <div style={{ background: 'var(--surface)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flexShrink: 0, padding: 5, background: `${primary}12`, borderRadius: wrapR, border: `1.5px solid ${primary}30` }}>
              {schoolLogo ? <img src={schoolLogo} alt="logo" style={{ width: 32, height: 32, borderRadius: r, objectFit: 'cover', display: 'block' }} /> : <div style={{ width: 32, height: 32, borderRadius: r, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={14} style={{ color: primary }} /></div>}
            </div>
            <div style={{ borderRight: '1px solid var(--border)', paddingRight: 12, flexShrink: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: 'var(--text1)', lineHeight: 1.2 }}>{portalName || 'Veridict'}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{schoolName || 'Official Judging Portal'}</div>
            </div>
            <div style={{ flex: 1, paddingLeft: 4, minWidth: 80 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 2 }}>Active Contest</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Sample Contest 2025</div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)' }}>Judging As</div>
              <select style={{ appearance: 'none', padding: '7px 28px 7px 12px', background: primary, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 2px 8px ${primary}40` }}>
                <option>Select Judge…</option><option>Judge 1</option><option>Judge 2</option>
              </select>
            </div>
          </div>
          {footerText && <div style={{ background: 'var(--surface2)', padding: '5px 16px', fontSize: 10, color: 'var(--text3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}><span>{footerText}</span><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: secondary, display: 'inline-block' }} />Secure Session</span></div>}
        </div>
      );
    },
  },
];

export default HEADER_TEMPLATES