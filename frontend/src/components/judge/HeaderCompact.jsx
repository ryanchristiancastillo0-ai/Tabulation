import { Building2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  JudgeSelector
} from '../../components/judge/index'
import { getSchoolId, clearJudgeToken, clearActiveSchoolId } from '../../utils/judge';

export default function HeaderCompact({ sysConfig, contestName, selectedJudge, judgeCount, updateJudge, isJudgeLocked }) {
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
    <div className="w-full border-b" style={{ borderColor: secondary + '40' }}>
      <div
        className="h-12 px-4 flex items-center gap-3"
        style={{ background: primary }}
      >
        {/* Logo / brand */}
        <div className="flex items-center gap-2 shrink-0">
          {sysConfig.school_logo ? (
            <img
              src={sysConfig.school_logo}
              alt="logo"
              className="w-7 h-7 object-cover border border-white/25"
              style={{ borderRadius: r }}
            />
          ) : (
            <div
              className="w-7 h-7 bg-white/10 border border-white/20 flex items-center justify-center"
              style={{ borderRadius: r }}
            >
              <Building2 size={12} className="text-white" />
            </div>
          )}
          <div className="leading-tight hidden sm:block">
            <div className="font-semibold text-[13px] text-white max-w-[110px] truncate">
              {sysConfig.portal_name || 'Veridict'}
            </div>
            <div className="text-[10px] text-white/50 max-w-[110px] truncate">
              {sysConfig.school_name || 'Judge Portal'}
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-white/15 shrink-0" />

        {/* Now judging */}
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <span className="text-[10px] font-medium text-white/45 shrink-0">Now judging</span>
          <span className="text-[13px] font-semibold text-white truncate">
            {contestName || 'Loading…'}
          </span>
        </div>

        {/* Judge selector + logout */}
        <div className="flex items-center gap-2 shrink-0">
          <JudgeSelector
            selectedJudge={selectedJudge}
            judgeCount={judgeCount}
            updateJudge={updateJudge}
            isJudgeLocked={isJudgeLocked}
            primary={primary}
            compact={true}
            darkBg={true}
          />
          <button
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="flex items-center justify-center w-7 h-7 rounded transition-colors hover:bg-white/10 active:scale-95"
            style={{ border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <LogOut size={13} className="text-white/90" />
          </button>
        </div>
      </div>

      {sysConfig.footer_text && (
        <div className="bg-gray-50 px-4 py-1 text-[10px] text-gray-500 flex justify-between items-center border-t border-gray-100">
          <span>{sysConfig.footer_text}</span>
          <span className="text-gray-400">Encrypted · Secure Session</span>
        </div>
      )}
    </div>
  );
}