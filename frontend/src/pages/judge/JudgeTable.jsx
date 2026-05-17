import { useState, useEffect, useRef, memo } from 'react';
import {
  WifiOff, ShieldCheck, Activity, Lock,
  ChevronRight, Menu, X, User, Trophy, Shield,
  Building2,
} from 'lucide-react';
import { StatusModal } from '../../components/judge/StatusModal';
import { useJudgeSystem } from '../../hooks/judge/useJudgeSystem';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/* ── Utility ─────────────────────────────────────────────────────── */
function getSchoolId() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('school_id')) return params.get('school_id');
    const user = localStorage.getItem('adminUser');
    if (user) return JSON.parse(user)?.school_id || 1;
    const auth = localStorage.getItem('auth');
    if (auth) return JSON.parse(auth)?.admin?.school_id || 1;
    return 1;
  } catch {
    return 1;
  }
}

/* ── Poll lock state ─────────────────────────────────────────────── */
function useJudgeLockState(pollInterval = 4000) {
  const [isJudgeLocked, setIsJudgeLocked] = useState(false);
  const lockedRef = useRef(false);

  useEffect(() => {
    const schoolId = getSchoolId();
    const poll = async () => {
      try {
        const res  = await fetch(`${API_BASE}/public/get-all-data?school_id=${schoolId}`);
        const data = await res.json();
        if (data && !data.error) {
          const settings = data.settings || {};
          const serverLocked =
            settings.is_judge_locked === 1 ||
            settings.is_judge_locked === true ||
            settings.is_judge_locked === '1';
          if (serverLocked !== lockedRef.current) {
            lockedRef.current = serverLocked;
            setIsJudgeLocked(serverLocked);
          }
        }
      } catch (err) {
        console.warn('[JudgeTable] lock poll error:', err.message);
      }
    };
    poll();
    const interval = setInterval(poll, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  return isJudgeLocked;
}

/* ── System config ───────────────────────────────────────────────── */
function useSystemConfig() {
  const [sysConfig, setSysConfig] = useState({
    school_name:     '',
    portal_name:     '',
    school_logo:     '',
    background_logo: '',
    primary_color:   '#006c49',
    secondary_color: '#10b981',
    footer_text:     '',
    logo_radius:     12,
    header_template: 'structured',
  });

  useEffect(() => {
    const school_id = getSchoolId();
    const fetchConfig = async () => {
      try {
        const res  = await fetch(`${API_BASE}/public/system-config?school_id=${school_id}`);
        const data = await res.json();
        if (data && !data.error) {
          const clean = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== null && v !== undefined)
          );
          setSysConfig(prev => ({ ...prev, ...clean }));
        }
      } catch (err) {
        console.error('system-config error:', err);
      }
    };
    fetchConfig();
  }, []);

  return sysConfig;
}

/* ── Contest name poller ─────────────────────────────────────────── */
function useContestName(configSettingsName, pollInterval = 5000) {
  const [contestName, setContestName] = useState(configSettingsName || '');

  useEffect(() => {
    if (configSettingsName) setContestName(configSettingsName);
  }, [configSettingsName]);

  useEffect(() => {
    const schoolId = getSchoolId();
    const poll = async () => {
      try {
        const res  = await fetch(`${API_BASE}/public/get-all-data?school_id=${schoolId}`);
        const data = await res.json();
        if (data && !data.error) {
          const name = data.settings?.contest_name || '';
          if (name) setContestName(name);
        }
      } catch {
        // silent
      }
    };
    const interval = setInterval(poll, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  return contestName;
}

/* ── Offline Banner ──────────────────────────────────────────────── */
function OfflineBanner() {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-white text-xs font-bold tracking-widest uppercase bg-red-500 text-center flex-wrap">
      <WifiOff size={12} className="shrink-0" />
      <span>Offline — Scores will sync when reconnected</span>
    </div>
  );
}

/* ── Lock Banner ─────────────────────────────────────────────────── */
function LockBanner({ selectedJudge }) {
  if (selectedJudge) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-amber-200 text-xs font-bold tracking-wider uppercase bg-amber-900 text-center flex-wrap">
        <Lock size={11} className="shrink-0" />
        <span>Locked in as Judge {selectedJudge} — switching disabled</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-red-300 text-xs font-bold tracking-wider uppercase bg-red-950 text-center flex-wrap">
      <Lock size={11} className="shrink-0" />
      <span>Judge switching is locked — select your judge once to begin</span>
    </div>
  );
}

/* ── Logo Mark ───────────────────────────────────────────────────── */
function LogoMark({ sysConfig, size = 34 }) {
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

/* ── Judge Selector ──────────────────────────────────────────────── */
function JudgeSelector({ selectedJudge, judgeCount, updateJudge, isJudgeLocked, primary, compact = false, darkBg = false }) {
  const selectDisabled = isJudgeLocked && !!selectedJudge;

  return (
    <div className="relative" style={{ width: compact ? undefined : '100%' }}>
      <select
        value={selectedJudge}
        onChange={e => {
          if (selectDisabled) return;
          updateJudge(e.target.value);
        }}
        disabled={selectDisabled}
        title={selectDisabled ? 'Judge switching is locked by the administrator' : ''}
        className="appearance-none rounded-lg font-bold outline-none transition-all"
        style={{
          fontFamily:    'inherit',
          fontSize:      compact ? 13 : 14,
          paddingTop:    compact ? 6 : 10,
          paddingBottom: compact ? 6 : 10,
          paddingLeft:   compact ? 10 : 12,
          paddingRight:  32,
          minWidth:      compact ? '110px' : undefined,
          width:         compact ? undefined : '100%',
          background:    darkBg
            ? (selectDisabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.14)')
            : (selectDisabled ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.95)'),
          border:        darkBg
            ? '1.5px solid rgba(255,255,255,0.25)'
            : (selectDisabled ? '1.5px solid rgba(255,100,100,0.5)' : '1.5px solid rgba(255,255,255,0.4)'),
          color:         darkBg ? '#fff' : (selectDisabled ? '#6b7280' : '#191c1e'),
          cursor:        selectDisabled ? 'not-allowed' : 'pointer',
          opacity:       selectDisabled ? 0.7 : 1,
        }}
      >
        <option value="" style={{ color: '#191c1e' }}>Select Judge</option>
        {Array.from({ length: judgeCount || 0 }, (_, i) => (
          <option key={i + 1} value={i + 1} style={{ color: '#191c1e' }}>Judge {i + 1}</option>
        ))}
      </select>
      <div
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: darkBg ? 'rgba(255,255,255,0.6)' : (selectDisabled ? '#ef4444' : primary) }}
      >
        {selectDisabled ? <Lock size={12} /> : <ShieldCheck size={12} />}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   HEADER TEMPLATES
   ════════════════════════════════════════════════════════════════════ */

/* ── Template: Structured (two-row) ─────────────────────────────── */
function HeaderStructured({ sysConfig, contestName, selectedJudge, judgeCount, updateJudge, isJudgeLocked }) {
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

/* ── Template: Compact Bar (single row) ─────────────────────────── */
function HeaderCompact({ sysConfig, contestName, selectedJudge, judgeCount, updateJudge, isJudgeLocked }) {
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

/* ── Template: Elevated Card ─────────────────────────────────────── */
function HeaderElevated({ sysConfig, contestName, selectedJudge, judgeCount, updateJudge, isJudgeLocked }) {
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

/* ── Dynamic Header Router ───────────────────────────────────────── */
function DynamicHeaderContent({ sysConfig, contestName, selectedJudge, judgeCount, updateJudge, isJudgeLocked }) {
  const template = sysConfig.header_template || 'structured';
  const sharedProps = { sysConfig, contestName, selectedJudge, judgeCount, updateJudge, isJudgeLocked };

  if (template === 'compact')  return <HeaderCompact  {...sharedProps} />;
  if (template === 'elevated') return <HeaderElevated {...sharedProps} />;
  return <HeaderStructured {...sharedProps} />;
}

/* ── Mobile Drawer ───────────────────────────────────────────────── */
function MobileDrawer({
  isOpen, onClose,
  sysConfig, contestName,
  selectedJudge, judgeCount, updateJudge, isJudgeLocked,
  isOnline,
}) {
  const primary   = sysConfig.primary_color   || '#006c49';
  const secondary = sysConfig.secondary_color || '#10b981';

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      <div
        className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{
          background:    'rgba(0,0,0,0.55)',
          opacity:       isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 z-[70] h-full flex flex-col"
        style={{
          width:      '80vw',
          maxWidth:   320,
          background: '#fff',
          boxShadow:  '-4px 0 32px rgba(0,0,0,0.18)',
          transform:  isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ background: primary }}
        >
          <div className="flex items-center gap-2.5">
            <LogoMark sysConfig={sysConfig} size={30} />
            <div>
              <div className="text-sm font-extrabold text-white leading-tight">
                {sysConfig.portal_name || 'Veridict'}
              </div>
              {sysConfig.school_name && (
                <div className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {sysConfig.school_name}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg w-8 h-8 transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.15)' }}
            aria-label="Close menu"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        <div
          className="h-[3px] shrink-0"
          style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }}
        />

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          <div
            className="rounded-xl p-4"
            style={{ background: `${primary}10`, border: `1px solid ${primary}20` }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Trophy size={12} style={{ color: primary }} />
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: primary }}>
                Live Session
              </span>
            </div>
            <div className="text-sm font-bold text-[#191c1e] leading-snug">
              {contestName || 'Syncing contest…'}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <User size={12} style={{ color: primary }} />
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: primary }}>
                Select Your Role
              </span>
            </div>
            <JudgeSelector
              selectedJudge={selectedJudge}
              judgeCount={judgeCount}
              updateJudge={(val) => { updateJudge(val); onClose(); }}
              isJudgeLocked={isJudgeLocked}
              primary={primary}
              compact={false}
            />
            {isJudgeLocked && selectedJudge && (
              <p className="mt-2 text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                <Lock size={9} />
                Locked in — switching disabled by admin
              </p>
            )}
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              background: isOnline ? '#f0fdf4' : '#fef2f2',
              border:     `1px solid ${isOnline ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background: isOnline ? '#22c55e' : '#ef4444',
                  animation:  'pulse 2s infinite',
                }}
              />
              <span
                className="text-xs font-bold"
                style={{ color: isOnline ? '#15803d' : '#dc2626' }}
              >
                {isOnline ? 'Connected · Scores syncing' : 'Offline · Will sync on reconnect'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-40 mt-auto pt-2">
            <Shield size={11} className="text-[#3c4a42] shrink-0" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#3c4a42]">
              Encrypted · Secure Session
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Judge Header ────────────────────────────────────────────────── */
function JudgeHeader({
  sysConfig, contestName, selectedJudge,
  judgeCount, updateJudge, isOnline, isJudgeLocked,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const primary = sysConfig.primary_color || '#006c49';

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full"
        style={{ boxShadow: `0 2px 16px ${primary}60` }}
      >
        {!isOnline && <OfflineBanner />}
        {isJudgeLocked && <LockBanner selectedJudge={selectedJudge} />}

        <div className="hidden sm:block">
          <DynamicHeaderContent
            sysConfig={sysConfig}
            contestName={contestName}
            selectedJudge={selectedJudge}
            judgeCount={judgeCount}
            updateJudge={updateJudge}
            isJudgeLocked={isJudgeLocked}
          />
        </div>

        <div
          className="sm:hidden flex items-center justify-between gap-2 px-3"
          style={{ background: primary, height: 56 }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <LogoMark sysConfig={sysConfig} size={30} />
            <div className="min-w-0">
              <div
                className="font-extrabold text-sm text-white leading-tight"
                style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {sysConfig.portal_name || 'Veridict'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectedJudge && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
              >
                <User size={11} />
                <span>J{selectedJudge}</span>
              </div>
            )}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center justify-center w-9 h-9 rounded-lg transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)' }}
              aria-label="Open menu"
            >
              <Menu size={18} className="text-white" />
            </button>
          </div>
        </div>

        <div
          className="sm:hidden px-3 pb-1.5 text-center text-xs font-semibold truncate"
          style={{ background: primary, color: 'rgba(255,255,255,0.85)' }}
        >
          {contestName || 'Loading…'}
        </div>
      </header>

      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sysConfig={sysConfig}
        contestName={contestName}
        selectedJudge={selectedJudge}
        judgeCount={judgeCount}
        updateJudge={updateJudge}
        isJudgeLocked={isJudgeLocked}
        isOnline={isOnline}
      />
    </>
  );
}

/* ── Judge Footer ────────────────────────────────────────────────── */
function JudgeFooter({ sysConfig }) {
  const primary = sysConfig.primary_color || '#006c49';

  return (
    <footer
      className="mt-10 border-t border-white/10"
      style={{ backgroundColor: primary }}
    >
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {sysConfig.portal_name || 'Veridict'}
            </h2>
            <p className="text-sm mt-1 text-white/70 max-w-md leading-relaxed">
              Professional judging and tabulation platform for Catholic schools
              and academic institutions in the Philippines.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Secure System Active</p>
              <p className="text-xs text-white/60">Encrypted judging session</p>
            </div>
          </div>
        </div>
        <div className="w-full h-px bg-white/10 my-6" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-white/60 text-center md:text-left">
            © {new Date().getFullYear()}{' '}
            {sysConfig.school_name || 'Veridict'}.
            All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-white/60">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Security</span>
            <span className="hover:text-white transition-colors cursor-pointer">Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Static Criteria Header ──────────────────────────────────────── */
// FIX: title row now uses justify-content: center so the label + total
// are centred instead of flush left/right.
function CriteriaHeader({ criteria, primary, secondary }) {
  if (!criteria?.length) return null;

  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.percentage ?? 0), 0);

  return (
    <div
      className="w-full rounded-xl sm:rounded-2xl mb-4 sm:mb-7 overflow-hidden"
      style={{
        background: '#fff',
        border:     `1px solid ${primary}20`,
        boxShadow:  `0 2px 12px ${primary}0d`,
      }}
    >
      {/* Title row — centered */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',   /* ← FIX: was space-between, now center */
          gap:            12,
          padding:        '12px 28px',
          borderBottom:   `1px solid ${primary}12`,
          background:     `linear-gradient(90deg, ${primary}0a, #fff)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width:     6,
              height:    6,
              borderRadius: '50%',
              background:   secondary,
              boxShadow:    `0 0 0 3px ${secondary}30`,
              flexShrink:   0,
            }}
          />
          <span
            style={{
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color:         '#3c4a42',
            }}
          >
            Scoring Criteria
          </span>
        </div>

        <span
          style={{
            fontSize:   11,
            fontWeight: 700,
            color:      totalWeight === 100 ? '#6b7280' : '#dc2626',
          }}
        >
          {totalWeight}% total
        </span>
      </div>

      {/* Criteria rows */}
      <div style={{ padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {criteria.map((c, i) => {
          const weight = Number(c.percentage ?? 0);
          return (
            <div key={c.id ?? i}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#191c1e' }}>
                  {c.name}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: primary, fontVariantNumeric: 'tabular-nums' }}>
                  {weight}%
                </span>
              </div>
              <div
                style={{
                  width:        '100%',
                  height:       6,
                  borderRadius: 999,
                  overflow:     'hidden',
                  background:   `${primary}14`,
                }}
              >
                <div
                  style={{
                    height:     '100%',
                    width:      `${Math.min(weight, 100)}%`,
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${primary}, ${secondary})`,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Scroll Hint (mobile only) ───────────────────────────────────── */
function ScrollHint() {
  return (
    <div className="scroll-hint">
      <ChevronRight size={10} />
      <span>Scroll to see all columns</span>
    </div>
  );
}

/* ── Loading Spinner ─────────────────────────────────────────────── */
function LoadingSpinner({ secondary }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-4 opacity-50">
      <div
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-[3px]"
        style={{
          borderColor:    secondary,
          borderTopColor: 'transparent',
          animation:      'spin 0.8s linear infinite',
        }}
      />
      <p className="font-mono text-xs tracking-[0.18em] uppercase text-[#3c4a42]">
        Building Interface…
      </p>
    </div>
  );
}

/* ── Card Header Strip ───────────────────────────────────────────── */
function CardHeaderStrip({ primary, secondary, selectedJudge }) {
  return (
    <div
      className="flex items-center justify-between px-4 sm:px-7 py-3 sm:py-4"
      style={{
        borderBottom: `1px solid ${primary}15`,
        background:   `linear-gradient(90deg, ${primary}12, #fff)`,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: secondary,
            boxShadow:  `0 0 0 4px ${secondary}30`,
            animation:  'pulse 2s infinite',
          }}
        />
        <span className="text-xs font-bold tracking-widest uppercase text-[#3c4a42]">
          Scoring Terminal
        </span>
      </div>
      {selectedJudge && (
        <span
          className="text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full tracking-wide whitespace-nowrap"
          style={{ background: `${primary}15`, color: primary }}
        >
          Judge {selectedJudge}
        </span>
      )}
    </div>
  );
}

/* ── Memoized Scoring Card ───────────────────────────────────────── */
const ScoringCard = memo(function ScoringCard({ tableHtml, loading, selectedJudge, primary, secondary }) {
  return (
    <div
      className="bg-white rounded-xl sm:rounded-2xl overflow-hidden w-full"
      style={{
        border:    `1px solid ${primary}20`,
        boxShadow: `0 4px 24px ${primary}15`,
      }}
    >
      <CardHeaderStrip primary={primary} secondary={secondary} selectedJudge={selectedJudge} />

      {!loading && tableHtml && <ScrollHint />}

      {loading ? (
        <LoadingSpinner secondary={secondary} />
      ) : (
        <div className="ai-scroll-container">
          <div
            className="ai-rendered-content"
            dangerouslySetInnerHTML={{ __html: tableHtml }}
          />
        </div>
      )}
    </div>
  );
}, (prev, next) =>
  prev.tableHtml     === next.tableHtml     &&
  prev.loading       === next.loading       &&
  prev.selectedJudge === next.selectedJudge &&
  prev.primary       === next.primary       &&
  prev.secondary     === next.secondary
);

/* ── Submit Button ───────────────────────────────────────────────── */
function SubmitButton({ onClick, disabled, primary }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full sm:w-auto rounded-xl text-sm font-extrabold tracking-widest uppercase transition-all border-none"
      style={{
        fontFamily:  'inherit',
        padding:     '12px 40px',
        maxWidth:    '360px',
        background:  disabled ? '#e0e3e5' : primary,
        color:       disabled ? '#9ca3af' : '#fff',
        cursor:      disabled ? 'not-allowed' : 'pointer',
        boxShadow:   disabled ? 'none' : `0 6px 20px ${primary}40`,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = 'brightness(0.88)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
    >
      Submit Scores
    </button>
  );
}

/* ── Encrypted Badge ─────────────────────────────────────────────── */
function EncryptedBadge({ secondary }) {
  return (
    <div className="flex items-center gap-2 opacity-45">
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: secondary, animation: 'pulse 2s infinite' }}
      />
      <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#3c4a42]">
        Encrypted Connection Active
      </span>
    </div>
  );
}

/* ── Global Styles ───────────────────────────────────────────────── */
function GlobalStyles() {
  return (
    <style>{`
      @keyframes spin  { to { transform: rotate(360deg); } }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

      @keyframes hint-scroll {
        0%   { transform: translateX(0); opacity: 0.7; }
        60%  { transform: translateX(5px); opacity: 1; }
        100% { transform: translateX(0); opacity: 0.7; }
      }

      .ai-scroll-container {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 transparent;
      }
      .ai-scroll-container::-webkit-scrollbar        { height: 4px; }
      .ai-scroll-container::-webkit-scrollbar-track  { background: transparent; }
      .ai-scroll-container::-webkit-scrollbar-thumb  { background: #cbd5e1; border-radius: 999px; }

      .ai-rendered-content {
        font-size: clamp(11px, 1.8vw, 14px);
        display: inline-block;
        min-width: 100%;
      }
      .ai-rendered-content table {
        min-width: 540px;
        width: max-content;
        border-collapse: collapse;
        table-layout: auto;
      }
      .ai-rendered-content td,
      .ai-rendered-content th {
        white-space: nowrap;
        word-break: normal;
        box-sizing: border-box;
      }
      .ai-rendered-content select,
      .ai-rendered-content .score-dropdown {
        min-width: 58px;
        max-width: 100px;
      }
      .ai-rendered-content > div {
        width: 100% !important;
        min-width: 100% !important;
        max-width: none !important;
        box-sizing: border-box !important;
        overflow: visible !important;
      }
      .ai-rendered-content > div > table,
      .ai-rendered-content table {
        width: 100% !important;
        min-width: 100% !important;
        box-sizing: border-box !important;
      }

      .scroll-hint { display: none; }
      @media (max-width: 639px) {
        .scroll-hint {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #94a3b8;
          padding: 6px 14px 2px;
          animation: hint-scroll 1.8s ease-in-out infinite;
        }
      }
    `}</style>
  );
}

/* ── Main JudgeTable ─────────────────────────────────────────────── */
function JudgeTable() {
  const {
    selectedJudge,
    dynamicUI,
    config,
    loading,
    modal,
    isOnline,
    closeModal,
    submitToDB,
    updateJudge,
  } = useJudgeSystem();

  const sysConfig     = useSystemConfig();
  const isJudgeLocked = useJudgeLockState(4000);
  const contestName   = useContestName(config.settings?.contest_name, 5000);

  const tableHtml  = typeof dynamicUI === 'string' ? dynamicUI : dynamicUI?.html || '';

  const primary   = sysConfig.primary_color   || '#006c49';
  const secondary = sysConfig.secondary_color || '#10b981';

  return (
    <div
      className="min-h-screen flex flex-col bg-[#f7f9fb] text-[#191c1e]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <GlobalStyles />

      <StatusModal
        isOpen={modal.show}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />

      <JudgeHeader
        sysConfig={sysConfig}
        contestName={contestName}
        selectedJudge={selectedJudge}
        judgeCount={config.settings?.judge_count}
        updateJudge={updateJudge}
        isOnline={isOnline}
        isJudgeLocked={isJudgeLocked}
      />

      <main className="flex-1 w-full max-w-screen-xl mx-auto px-3 sm:px-6 lg:px-12 py-4 sm:py-8 lg:py-10">

        {!loading && (
          <CriteriaHeader
            criteria={config.criteria}
            primary={primary}
            secondary={secondary}
          />
        )}

        <ScoringCard
          tableHtml={tableHtml}
          loading={loading}
          selectedJudge={selectedJudge}
          primary={primary}
          secondary={secondary}
        />

        <div className="mt-6 sm:mt-10 flex flex-col items-center gap-3 sm:gap-4 pb-4">
          <SubmitButton
            onClick={submitToDB}
            disabled={!selectedJudge || loading}
            primary={primary}
          />
          <EncryptedBadge secondary={secondary} />
        </div>
      </main>

      <JudgeFooter sysConfig={sysConfig} />
    </div>
  );
}

export default JudgeTable;