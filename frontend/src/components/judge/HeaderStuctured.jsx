
import {

  Building2,
} from 'lucide-react';


import {
 JudgeSelector,
} from '../../components/judge/index'

export default function HeaderStructured({ sysConfig, contestName, selectedJudge, judgeCount, updateJudge, isJudgeLocked }) {
  const primary   = sysConfig.primary_color   || '#006c49';
  const secondary = sysConfig.secondary_color || '#10b981';
  const logoRadius = sysConfig.logo_radius != null ? sysConfig.logo_radius : 12;
  const r = logoRadius >= 999 ? '50%' : `${logoRadius}px`;

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          background: primary,
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {sysConfig.school_logo ? (
          <img
            src={sysConfig.school_logo}
            alt="logo"
            style={{
              width: 34, height: 34, borderRadius: r,
              objectFit: 'cover',
              border: '1.5px solid rgba(255,255,255,0.35)',
              flexShrink: 0,
            }}
          />
        ) : (
          <div style={{
            width: 34, height: 34, borderRadius: r,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            border: '1.5px solid rgba(255,255,255,0.25)',
          }}>
            <Building2 size={15} style={{ color: '#fff' }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sysConfig.portal_name || 'Veridict'}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sysConfig.school_name || 'Official Judging Portal'}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          flexShrink: 0,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: secondary, display: 'inline-block' }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.1em' }}>LIVE</span>
        </div>
      </div>

      <div style={{ height: 2, background: secondary }} />

      <div style={{
        background: '#fff',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: 2 }}>
            Active Contest
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#191c1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contestName || 'Loading…'}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>
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
          padding: '5px 20px',
          fontSize: 10,
          color: '#6b7280',
          textAlign: 'center',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          {sysConfig.footer_text}
        </div>
      )}
    </div>
  );
}