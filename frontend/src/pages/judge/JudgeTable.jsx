import { useState, useEffect, useRef, memo } from 'react';
import {
  WifiOff, ShieldCheck, Activity, Lock,
  ChevronRight, Menu, X, User, Trophy, Shield,
  Building2,
} from 'lucide-react';
import { useJudgeSystem } from '../../hooks/judge/useJudgeSystem';
import {getSchoolId} from '../../utils/judge'
import {getHydra_and_Calcu} from '../../hooks/judge/getHydration_and_Calculation'
import {useConnectivity} from '../../hooks/judge/useConnectivity'
import {useContestName} from '../../hooks/judge/useContestName'
import {useCriteriaGenerator} from '../../hooks/judge/useCreteria'
import {useJudgeLockState} from '../../hooks/judge/useJudgeLockState'
import {useSystemConfig} from '../../hooks/judge/useSystemConfig'
import {useJudgePersistence} from '../../hooks/judge/useJudgePersistence'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
import {GlobalStyles} from '../../css/judge/GlobalStyles.jsx'
import {CardHeaderStrip,CriteriaHeader,CriteriaManager,DynamicHeaderContent,EncryptedBadge,
  HeaderCompact,HeaderElevated,HeaderStructured,
  JudgeFooter,JudgeHeader,JudgeSelector,LoadingSpinner,LockBanner,LogoMark,MobileDrawer,OfflineBanner,
  ScoringCard,ScrollHint,StatusModal,SubmitButton
} from '../../components/judge/index'
/* ── Utility ─────────────────────────────────────────────────────── */

/* ── Poll lock state ─────────────────────────────────────────────── */


/* ── System config ───────────────────────────────────────────────── */


/* ── Contest name poller ─────────────────────────────────────────── */


/* ── Offline Banner ──────────────────────────────────────────────── */

/* ── Lock Banner ─────────────────────────────────────────────────── */


/* ── Logo Mark ───────────────────────────────────────────────────── */


/* ── Judge Selector ──────────────────────────────────────────────── */


/* ════════════════════════════════════════════════════════════════════
   HEADER TEMPLATES
   ════════════════════════════════════════════════════════════════════ */

/* ── Template: Structured (two-row) ─────────────────────────────── */


/* ── Template: Compact Bar (single row) ─────────────────────────── */


/* ── Template: Elevated Card ─────────────────────────────────────── */


/* ── Dynamic Header Router ───────────────────────────────────────── */


/* ── Judge Header ────────────────────────────────────────────────── */


/* ── Judge Footer ────────────────────────────────────────────────── */


/* ── Static Criteria Header ──────────────────────────────────────── */
// FIX: title row now uses justify-content: center so the label + total
// are centred instead of flush left/right.


/* ── Scroll Hint (mobile only) ───────────────────────────────────── */


/* ── Loading Spinner ─────────────────────────────────────────────── */

/* ── Card Header Strip ───────────────────────────────────────────── */


/* ── Memoized Scoring Card ───────────────────────────────────────── */


/* ── Submit Button ───────────────────────────────────────────────── */


/* ── Encrypted Badge ─────────────────────────────────────────────── */


/* ── Global Styles ───────────────────────────────────────────────── */


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