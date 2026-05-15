import { useState, useEffect, useRef, memo } from 'react';
import {
  WifiOff, ShieldCheck, Activity, Lock,
  ChevronRight, Menu, X, User, Trophy, Shield,
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
// FIX: Dedicated poller for contest name so it never shows stale
// "Syncing contest…" after lock/unlock actions that don't reload config.
function useContestName(configSettingsName, pollInterval = 5000) {
  const [contestName, setContestName] = useState(configSettingsName || '');

  // Sync immediately when config loads
  useEffect(() => {
    if (configSettingsName) setContestName(configSettingsName);
  }, [configSettingsName]);

  // Keep polling so unlock/lock never leaves a stale name
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
        // silent — stale name is better than a crash
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
function JudgeSelector({ selectedJudge, judgeCount, updateJudge, isJudgeLocked, primary, compact = false }) {
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
          background:    selectDisabled ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.95)',
          border:        selectDisabled ? '1.5px solid rgba(255,100,100,0.5)' : '1.5px solid rgba(255,255,255,0.4)',
          color:         selectDisabled ? '#6b7280' : '#191c1e',
          cursor:        selectDisabled ? 'not-allowed' : 'pointer',
          opacity:       selectDisabled ? 0.7 : 1,
        }}
      >
        <option value="">Select Judge</option>
        {Array.from({ length: judgeCount || 0 }, (_, i) => (
          <option key={i + 1} value={i + 1}>Judge {i + 1}</option>
        ))}
      </select>
      <div
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: selectDisabled ? '#ef4444' : primary }}
      >
        {selectDisabled ? <Lock size={12} /> : <ShieldCheck size={12} />}
      </div>
    </div>
  );
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{
          background:    'rgba(0,0,0,0.55)',
          opacity:       isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* Slide-in panel */}
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
        {/* Drawer header */}
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

        {/* Accent bar */}
        <div
          className="h-[3px] shrink-0"
          style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }}
        />

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">

          {/* Contest info card */}
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

          {/* Judge selector */}
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

          {/* Connection status */}
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

          {/* Security note — pinned to bottom */}
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

  const primary   = sysConfig.primary_color   || '#006c49';
  const secondary = sysConfig.secondary_color || '#10b981';

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full"
        style={{ background: primary, boxShadow: `0 2px 16px ${primary}60` }}
      >
        {/* ── Status banners ── */}
        {!isOnline && <OfflineBanner />}
        {isJudgeLocked && <LockBanner selectedJudge={selectedJudge} />}

        {/* ── Main nav row ── */}
        <div
          className="w-full max-w-screen-xl mx-auto flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-12"
          style={{ height: 60 }}
        >
          {/* Left: logo + name */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <LogoMark sysConfig={sysConfig} size={34} />
            <div className="min-w-0">
              <div
                className="font-extrabold text-sm sm:text-base text-white leading-tight tracking-tight"
                style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {sysConfig.portal_name || 'Veridict'}
              </div>
              <div
                className="hidden sm:block text-xs font-medium"
                style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {sysConfig.school_name || 'Judge Portal'}
              </div>
            </div>
          </div>

          {/* Center: contest name — desktop only */}
          <div className="hidden sm:flex flex-1 flex-col items-center text-center px-2 min-w-0">
            <span
              className="inline-block text-white text-xs font-bold tracking-widest uppercase px-3 py-0.5 rounded-full mb-1 whitespace-nowrap"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              Live Judging Session
            </span>
            <div
              className="text-xs sm:text-sm font-bold text-white tracking-tight"
              style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {/* FIX: show placeholder only while truly empty, never flicker back */}
              {contestName || 'Loading…'}
            </div>
          </div>

          {/* Right: desktop selector / mobile controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop */}
            <div className="hidden sm:block">
              <JudgeSelector
                selectedJudge={selectedJudge}
                judgeCount={judgeCount}
                updateJudge={updateJudge}
                isJudgeLocked={isJudgeLocked}
                primary={primary}
                compact={true}
              />
            </div>

            {/* Mobile: active judge pill */}
            {selectedJudge && (
              <div
                className="sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
              >
                <User size={11} />
                <span>J{selectedJudge}</span>
              </div>
            )}

            {/* Mobile: hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)' }}
              aria-label="Open menu"
            >
              <Menu size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Contest name row — mobile only */}
        <div
          className="sm:hidden px-3 pb-1.5 text-center text-xs font-semibold truncate"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          {contestName || 'Loading…'}
        </div>

        {/* Bottom accent bar */}
        <div
          className="h-[3px]"
          style={{ background: `linear-gradient(90deg, rgba(255,255,255,0.3), ${secondary}, rgba(255,255,255,0.3))` }}
        />
      </header>

      {/* Drawer rendered at this level so it can overlay the sticky header */}
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
        
        {/* Top Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {sysConfig.portal_name || 'Veridict'}
            </h2>

            <p className="text-sm mt-1 text-white/70 max-w-md leading-relaxed">
              Professional judging and tabulation platform for Catholic schools
              and academic institutions in the Philippines.
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                Secure System Active
              </p>
              <p className="text-xs text-white/60">
                Encrypted judging session
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/10 my-6" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          
          <p className="text-white/60 text-center md:text-left">
            © {new Date().getFullYear()}{" "}
            {sysConfig.school_name || 'Veridict'}.
            All rights reserved.
          </p>

          <div className="flex items-center gap-5 text-white/60">
            <span className="hover:text-white transition-colors cursor-pointer">
              Privacy
            </span>

            <span className="hover:text-white transition-colors cursor-pointer">
              Security
            </span>

            <span className="hover:text-white transition-colors cursor-pointer">
              Support
            </span>
          </div>
        </div>
      </div>
    </footer>
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

      /* ── Scroll container ── */
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

      /* ── AI content ── */
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
        width: auto !important;
        max-width: none !important;
        overflow: visible !important;
      }

      /* ── Scroll hint ── */
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

  // FIX: useContestName keeps polling independently so "Syncing contest…"
  // never persists after a lock/unlock action wipes or delays the config.
  // It seeds from config.settings.contest_name when it arrives, then keeps
  // a live poll running so any admin change reflects within ~5 s.
  const contestName = useContestName(config.settings?.contest_name, 5000);

  const headerHtml = dynamicUI?.headerHtml || '';
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
  headerTemplate={sysConfig.header_template || 'structured'} // ADD THIS
/>

      <main className="flex-1 w-full max-w-screen-xl mx-auto px-3 sm:px-6 lg:px-12 py-4 sm:py-8 lg:py-10">

        {/* AI-generated criteria header — also scroll-safe */}
        {!loading && headerHtml && (
          <div className="dynamic-header-area mb-4 sm:mb-7 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display: 'inline-block', minWidth: '100%' }} dangerouslySetInnerHTML={{ __html: headerHtml }} />
          </div>
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