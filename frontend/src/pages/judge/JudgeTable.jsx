import { useJudgeSystem } from '../../hooks/judge/useJudgeSystem';
import {useSystemConfig} from '../../hooks/judge/useSystemConfig'
import {useContestContext} from '../../providers/ContestContext'

import {GlobalStyles} from '../../css/judge/GlobalStyles.jsx'
import {CriteriaHeader,EncryptedBadge,CardHeaderStrip,
  
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
    isComplete,
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
        onConfirm={modal.onConfirm}
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

      <main className="flex-1 w-full max-w-screen-xl xl:max-w-[1440px] 2xl:max-w-[1920px] 3xl:max-w-[2560px] 4xl:max-w-[3200px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-10 py-4 sm:py-8 lg:py-10">

        {!loading && (
          <CriteriaHeader
            criteria={config.criteria}
            primary={primary}
            secondary={secondary}
          />
        )}

        <div
          className="bg-white rounded-sm sm:rounded-sm overflow-hidden w-full"
          style={{
            border:    `1px solid ${primary}20`,
            boxShadow: `0 4px 24px ${primary}15`,
          }}
        >
          <CardHeaderStrip primary={primary} secondary={secondary} selectedJudge={selectedJudge} />

          <ScoringCard
            tableHtml={tableHtml}
            loading={loading}
          />
        </div>

        <div className="mt-6 sm:mt-10 flex flex-col items-center gap-3 sm:gap-4 pb-4">
          <SubmitButton
            onClick={submitToDB}
            disabled={!selectedJudge || loading}
            complete={isComplete}
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