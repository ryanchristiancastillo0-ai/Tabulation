import {
  Building2,
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  JudgeSelector,
} from '../../components/judge/index';
import { getSchoolId, clearJudgeToken, clearActiveSchoolId } from '../../utils/judge';

export default function HeaderStructured({ sysConfig, contestName, selectedJudge, judgeCount, updateJudge, isJudgeLocked }) {
  const primary   = sysConfig.primary_color   || '#1B4332';
  const secondary = sysConfig.secondary_color || '#2D6A4F';
  const logoRadius = sysConfig.logo_radius != null ? sysConfig.logo_radius : 12;
  const r = logoRadius >= 999 ? '50%' : `${logoRadius}px`;
  const navigate = useNavigate();

  const handleLogout = () => {
    const sid = getSchoolId();
    localStorage.removeItem('judgeToken');
    localStorage.removeItem('judgeSchool');
    localStorage.removeItem(`judge_id_${sid}`);
    localStorage.removeItem('auth');
    clearJudgeToken(sid);
    clearActiveSchoolId();
    navigate('/judge/login');
  };

  return (
    <div className="w-full">
      {/* Brand row – unchanged */}
      <div
        className="px-4 py-2 flex items-center gap-3"
        style={{ background: primary }}
      >
        {sysConfig.school_logo ? (
          <img
            src={sysConfig.school_logo}
            alt="logo"
            className="w-8 h-8 object-cover border border-white/30 shrink-0"
            style={{ borderRadius: r }}
          />
        ) : (
          <div
            className="w-8 h-8 bg-white/10 border border-white/20 flex items-center justify-center shrink-0"
            style={{ borderRadius: r }}
          >
            <Building2 size={14} className="text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[13px] text-white leading-tight truncate">
            {sysConfig.portal_name || 'Veridict'}
          </div>
          <div className="text-[10px] text-white/55 truncate">
            {sysConfig.school_name || 'Official Judging Portal'}
          </div>
        </div>
      </div>

      <div className="h-[2px]" style={{ background: secondary }} />

      {/* Contest + judge row – IMPROVED LAYOUT */}
      <div className="bg-white px-4 py-3 flex items-center gap-6 border-b border-black/[0.06]">
        {/* Left: contest info */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
            Active contest
          </div>
          <div className="text-sm font-semibold text-[#14201A] truncate">
            {contestName || 'Loading…'}
          </div>
        </div>

        {/* Right: judge selector + logout – better grouping */}
        <div className="flex items-center gap-4 shrink-0 bg-gray-50/80 rounded-lg px-3 py-1.5 border border-gray-100/80">
          {/* Judge selector block */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">
              Judging as
            </span>
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

          {/* Vertical divider */}
          <div className="w-px h-6 bg-gray-300/60" />

          {/* Logout button with label */}
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/70 px-2 py-1 rounded-md transition-colors"
          >
            <LogOut size={16} className="shrink-0" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {sysConfig.footer_text && (
        <div className="bg-gray-50 px-4 py-1 text-[10px] text-gray-500 text-center border-b border-black/[0.06]">
          {sysConfig.footer_text}
        </div>
      )}
    </div>
  );
}