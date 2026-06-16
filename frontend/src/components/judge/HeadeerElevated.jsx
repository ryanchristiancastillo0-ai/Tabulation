
import { Building2,} from 'lucide-react';
import {JudgeSelector,} from '../../components/judge/index'


export default function HeaderElevated({ sysConfig, contestName, selectedJudge, judgeCount, updateJudge, isJudgeLocked }) {
  const primary   = sysConfig.primary_color   || '#006c49';
  const secondary = sysConfig.secondary_color || '#10b981';
  const logoRadius = sysConfig.logo_radius != null ? sysConfig.logo_radius : 12;
  const r = logoRadius >= 999 ? '50%' : `${logoRadius}px`;
  const wrapR = logoRadius >= 999 ? '50%' : `${Math.min((logoRadius || 0) + 4, 16)}px`;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: 4, background: primary }} />

      <div style={{
        background: '#fff',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}>
        <div style={{
          flexShrink: 0,
          padding: 6,
          background: `${primary}12`,
          borderRadius: wrapR,
          border: `1.5px solid ${primary}30`,
        }}>
          {sysConfig.school_logo ? (
            <img src={sysConfig.school_logo} alt="logo" style={{ width: 36, height: 36, borderRadius: r, objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: r, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} style={{ color: primary }} />
            </div>
          )}
        </div>

        <div style={{ borderRight: '1px solid #e5e7eb', paddingRight: 16, flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#191c1e', lineHeight: 1.2, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sysConfig.portal_name || 'Veridict'}
          </div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sysConfig.school_name || 'Official Judging Portal'}
          </div>
        </div>

        <div style={{ flex: 1, paddingLeft: 4, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', marginBottom: 3 }}>
            Active Contest
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#191c1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contestName || 'Loading…'}
          </div>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280' }}>
            Judging As
          </div>
          <JudgeSelector
            selectedJudge={selectedJudge}
            judgeCount={judgeCount}
            updateJudge={updateJudge}
            isJudgeLocked={isJudgeLocked}
            primary={primary}
            compact={true}
            darkBg={false}
          />
        </div>
      </div>

      {sysConfig.footer_text && (
        <div style={{
          background: '#f9fafb',
          padding: '6px 20px',
          fontSize: 10,
          color: '#6b7280',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <span>{sysConfig.footer_text}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: secondary, display: 'inline-block' }} />
            Secure Session
          </span>
        </div>
      )}
    </div>
  );
}