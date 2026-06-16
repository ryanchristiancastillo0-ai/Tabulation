import {useEffect } from 'react';
import {Lock,X, User, Trophy, Shield,} from 'lucide-react';


import {JudgeSelector,LogoMark} from '../../components/judge/index'

export default function MobileDrawer({
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