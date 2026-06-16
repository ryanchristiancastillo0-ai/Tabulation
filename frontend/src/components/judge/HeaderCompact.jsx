
import {  Building2,} from 'lucide-react';

import {
  JudgeSelector
} from '../../components/judge/index'

export default function HeaderCompact({ sysConfig, contestName, selectedJudge, judgeCount, updateJudge, isJudgeLocked }) {
  const primary   = sysConfig.primary_color   || '#006c49';
  const secondary = sysConfig.secondary_color || '#10b981';
  const logoRadius = sysConfig.logo_radius != null ? sysConfig.logo_radius : 12;
  const r = logoRadius >= 999 ? '50%' : `${logoRadius}px`;

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        background: primary,
        padding: '0 20px',
        minHeight: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          paddingRight: 16,
          borderRight: '1px solid rgba(255,255,255,0.18)',
          flexShrink: 0,
        }}>
          {sysConfig.school_logo ? (
            <img src={sysConfig.school_logo} alt="logo" style={{ width: 32, height: 32, borderRadius: r, objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.3)' }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: r, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.2)' }}>
              <Building2 size={13} style={{ color: '#fff' }} />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 800, fontSize: 12, color: '#fff', lineHeight: 1.1, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sysConfig.portal_name || 'Veridict'}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 1, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sysConfig.school_name || 'Judge Portal'}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
            Now Judging
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contestName || 'Loading…'}
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          paddingLeft: 16,
          borderLeft: '1px solid rgba(255,255,255,0.18)',
          flexShrink: 0,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: secondary, flexShrink: 0 }} />
          <JudgeSelector
            selectedJudge={selectedJudge}
            judgeCount={judgeCount}
            updateJudge={updateJudge}
            isJudgeLocked={isJudgeLocked}
            primary={primary}
            compact={true}
            darkBg={true}
          />
        </div>
      </div>

      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${secondary}, transparent)` }} />

      {sysConfig.footer_text && (
        <div style={{
          background: '#f9fafb',
          padding: '5px 20px',
          fontSize: 10,
          color: '#6b7280',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <span>{sysConfig.footer_text}</span>
          <span style={{ color: '#9ca3af', opacity: 0.7 }}>Encrypted · Secure Session</span>
        </div>
      )}
    </div>
  );
}