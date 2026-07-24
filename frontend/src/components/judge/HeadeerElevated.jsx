import { Building2 } from 'lucide-react';
import { JudgeSelector } from '../../components/judge/index'


export default function HeaderElevated({ sysConfig, contestName, selectedJudge, judgeCount, updateJudge, isJudgeLocked }) {
  const primary   = sysConfig.primary_color   || '#006c49';
  const secondary = sysConfig.secondary_color || '#10b981';
  const logoRadius = sysConfig.logo_radius != null ? sysConfig.logo_radius : 12;
  const r = logoRadius >= 999 ? '50%' : `${logoRadius}px`;
  const wrapR = logoRadius >= 999 ? '50%' : `${Math.min((logoRadius || 0) + 4, 16)}px`;

  return (
    <div className="w-full">
      <div className="h-1" style={{ background: primary }} />

      <div className="bg-white px-5 py-3.5 flex items-center gap-4 border-b border-black/[0.08]">
        {/* Logo */}
        <div
          className="shrink-0 p-1.5"
          style={{
            background: `${primary}12`,
            borderRadius: wrapR,
            border: `1.5px solid ${primary}30`,
          }}
        >
          {sysConfig.school_logo ? (
            <img
              src={sysConfig.school_logo}
              alt="logo"
              className="w-9 h-9 object-cover block"
              style={{ borderRadius: r }}
            />
          ) : (
            <div
              className="w-9 h-9 flex items-center justify-center"
              style={{ borderRadius: r }}
            >
              <Building2 size={16} style={{ color: primary }} />
            </div>
          )}
        </div>

        {/* Portal / school name */}
        <div className="border-r border-gray-200 pr-4 shrink-0">
          <div className="font-extrabold text-[13px] text-[#191c1e] leading-tight max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
            {sysConfig.portal_name || 'Veridict'}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
            {sysConfig.school_name || 'Official Judging Portal'}
          </div>
        </div>

        {/* Active contest */}
        <div className="flex-1 pl-1 min-w-0">
          <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500 mb-[3px]">
            Active Contest
          </div>
          <div className="text-[13px] font-bold text-[#191c1e] overflow-hidden text-ellipsis whitespace-nowrap">
            {contestName || 'Loading…'}
          </div>
        </div>

        {/* Judge selector */}
        <div className="shrink-0 flex flex-col gap-1 items-end">
          <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">
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
        <div className="bg-gray-50 px-5 py-1.5 text-[10px] text-gray-500 flex justify-between items-center border-b border-black/[0.06]">
          <span>{sysConfig.footer_text}</span>
          <span className="flex items-center gap-[5px]">
            <span
              className="w-[5px] h-[5px] rounded-full inline-block"
              style={{ background: secondary }}
            />
            Secure Session
          </span>
        </div>
      )}
    </div>
  );
}