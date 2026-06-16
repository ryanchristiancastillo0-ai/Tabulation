import { useState } from 'react';
import {
   Menu, User
} from 'lucide-react';


import {DynamicHeaderContent,LockBanner,LogoMark,MobileDrawer,OfflineBanner} from '../../components/judge/index'

export default function JudgeHeader({
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