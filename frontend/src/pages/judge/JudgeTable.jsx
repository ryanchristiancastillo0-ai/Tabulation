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
import {useCriteriaGenerator} from '../../hooks/judge/useCreteria'
import {useSystemConfig} from '../../hooks/judge/useSystemConfig'
import {useContestContext} from '../../providers/ContestContext'

import {GlobalStyles} from '../../css/judge/GlobalStyles.jsx'
import {CriteriaHeader,EncryptedBadge,
  
  JudgeFooter,JudgeHeader,
  ScoringCard,StatusModal,SubmitButton
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
  // Single global poller (ContestProvider → /public/get-all-data every 4s).
  // No local polling here — the old useJudgeLockState/useContestName hooks
  // fired overlapping duplicate requests to the same endpoint.
  const { isJudgeLocked, contestName, judgeCount } = useContestContext();

  const tableHtml  = typeof dynamicUI === 'string' ? dynamicUI : dynamicUI?.html || '';

  const primary   = sysConfig.primary_color   || '#1B4332';
  const secondary = sysConfig.secondary_color || '#2D6A4F';

  return (
    <div
      className="min-h-screen flex flex-col bg-[#FBFCF9] text-[#14201A]"
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
        judgeCount={judgeCount}
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