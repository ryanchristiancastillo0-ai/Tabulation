import { Building2 } from 'lucide-react';

import {
  JudgeSelector
} from '../../components/judge/index'

export default function HeaderCompact({ sysConfig, contestName, selectedJudge, judgeCount, updateJudge, isJudgeLocked }) {
  const primary   = sysConfig.primary_color   || '#006c49';
  const secondary = sysConfig.secondary_color || '#10b981';
  const logoRadius = sysConfig.logo_radius != null ? sysConfig.logo_radius : 12;
  const r = logoRadius >= 999 ? '50%' : `${logoRadius}px`;

  return (
    <div className="w-full">
      <div
        className="px-5 min-h-[60px] flex items-center gap-4"
        style={{ background: primary }}
      >
        {/* Logo / brand block */}
        <div className="flex items-center gap-2.5 pr-4 border-r border-white/[0.18] shrink-0">
          {sysConfig.school_logo ? (
            <img
              src={sysConfig.school_logo}
              alt="logo"
              className="w-8 h-8 object-cover border-[1.5px] border-white/30"
              style={{ borderRadius: r }}
            />
          ) : (
            <div
              className="w-8 h-8 bg-white/15 border-[1.5px] border-white/20 flex items-center justify-center"
              style={{ borderRadius: r }}
            >
              <Building2 size={13} className="text-white" />
            </div>
          )}
          <div>
            <div className="font-extrabold text-xs text-white leading-[1.1] max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
              {sysConfig.portal_name || 'Veridict'}
            </div>
            <div className="text-[9px] text-white/55 mt-px max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
              {sysConfig.school_name || 'Judge Portal'}
            </div>
          </div>
        </div>

        {/* Now judging */}
        <div className="flex-1 text-center min-w-0">
          <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/50 mb-0.5">
            Now Judging
          </div>
          <div className="text-[13px] font-extrabold text-white tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">
            {contestName || 'Loading…'}
          </div>
        </div>

        {/* Judge selector */}
        <div className="flex items-center gap-2 pl-4 border-l border-white/[0.18] shrink-0">
          <div
            className="w-[7px] h-[7px] rounded-full shrink-0"
            style={{ background: secondary }}
          />
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

      {/* Accent gradient divider */}
      <div
        className="h-[3px]"
        style={{ background: `linear-gradient(90deg, transparent, ${secondary}, transparent)` }}
      />

      {sysConfig.footer_text && (
        <div className="bg-gray-50 px-5 py-[5px] text-[10px] text-gray-500 flex justify-between items-center border-b border-black/[0.06]">
          <span>{sysConfig.footer_text}</span>
          <span className="text-gray-400/70">Encrypted · Secure Session</span>
        </div>
      )}
    </div>
  );
}