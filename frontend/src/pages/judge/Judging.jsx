import { useJudgeSystem } from '../../hooks/useJudgeSystem';
import {useSystemConfig} from '../../hooks/useSystemConfig'
import {useContestContext} from '../../context/ContestContext'
import { usePresence } from '../../hooks/usePresence';

import {GlobalStyles} from './components/GlobalStyles'
import {CriteriaHeader,EncryptedBadge,CardHeaderStrip,
  
  JudgeFooter,JudgeHeader,
  ScoringCard,StatusModal,SubmitButton
} from './components'

function JudgeTable() {
  usePresence('judge');
  const {
    selectedJudge,
    dynamicUI,
    config,
    loading,
    uiRefreshing,
    uiPending,
    waitSeconds,
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

  // The rich static table (buildStaticJudgeTable) is fully self-contained — it
  // already renders the criteria header, total/rank columns, the judging-strip
  // and its own footer. Wrapping more React chrome around it duplicates the UI,
  // so suppress CriteriaHeader / CardHeaderStrip / ScrollHint for it. AI-mode
  // tables vary and keep the normal chrome.
  const isRichStaticTable = tableHtml.includes('sts-table-wrap');

  const primary   = sysConfig.primary_color   || '#1B4332';
  const secondary = sysConfig.secondary_color || '#2D6A4F';

  // While the admin is still generating (empty ui_cache) and nothing can be
  // shown yet, display a friendly "being generated" placeholder instead of a
  // broken table. Refreshes automatically via syncNow + the ui_cache poll.
  const pendingUI = uiPending && !tableHtml && !loading;

  const body = pendingUI ? (
    <div
      className="flex flex-col items-center justify-center gap-4 py-24"
      style={{ background: '#FAFBFA' }}
    >
      <div
        className="h-10 w-10 rounded-full animate-spin"
        style={{ border: `3px solid ${primary}25`, borderTopColor: primary }}
      />
      <div className="text-center">
        <p className="font-semibold" style={{ color: '#14201A', fontSize: 15 }}>
          UI being generated
        </p>
        <p className="mt-1 text-sm" style={{ color: '#66736B' }}>
          The organizer is designing the scoring interface — it will appear here
          automatically in a few moments.
        </p>
      </div>
    </div>
  ) : (
    <ScoringCard
      tableHtml={tableHtml}
      loading={loading}
      refreshing={uiRefreshing}
      waitSeconds={waitSeconds}
      showScrollHint={!isRichStaticTable}
    />
  );

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

        {!loading && !isRichStaticTable && (
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
          {!isRichStaticTable && <CardHeaderStrip primary={primary} secondary={secondary} selectedJudge={selectedJudge} />}

          {body}
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