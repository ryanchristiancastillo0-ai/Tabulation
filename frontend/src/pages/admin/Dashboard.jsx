import { useState, useEffect } from "react";
import Sidebar from "../../components/admin/Sidebar";
import { Modal } from "../../components/admin/Modal";
import SectionRender, {
  MobileNavDrawer,

} from "../../components/admin/sectionRender"

import {MobileTopBar} from '../../components/admin/index'
import apiClient from "../../utils/apiClient";
import {navItems} from '../../constant/navlist.jsx'


function Dashboard() {
 const [dark, setDark] = useState(() => {
  const saved = localStorage.getItem("adminDarkMode");
  return saved !== null ? saved === "true" : false;
});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // ── Contest settings ────────────────────────────────────────────────────
  const [contestName,     setContestName]     = useState("");
  const [contestType,     setContestType]     = useState("pageant");
  const [aiPrompt,        setAiPrompt]        = useState("");
  const [judgeCount,      setJudgeCount]      = useState(3);
  const [calculationType, setCalculationType] = useState("average");
  const [isJudgeLocked,   setIsJudgeLocked]   = useState(false);

  // ── Criteria & Contestants ────────────────────────────────────────────────
  const [criteria,    setCriteria]    = useState([]);
  const [contestants, setContestants] = useState([]);

  // ── Add-form helpers ──────────────────────────────────────────────────────
  const [newCrit,   setNewCrit]   = useState("");
  const [newWeight, setNewWeight] = useState(10);
  const [newName,   setNewName]   = useState("");

  // ── System config ─────────────────────────────────────────────────────────
  const [schoolName,     setSchoolName]     = useState("");
  const [portalName,     setPortalName]     = useState("");
  const [schoolLogo,     setSchoolLogo]     = useState("");
  const [backgroundLogo, setBackgroundLogo] = useState("");
  const [primaryColor,   setPrimaryColor]   = useState("#22c55e");
  const [secondaryColor, setSecondaryColor] = useState("#0f172a");
  const [footerText,     setFooterText]     = useState("");
  const [logoRadius,     setLogoRadius]     = useState(12);
  const [headerTemplate, setHeaderTemplate] = useState("structured");

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeNav,       setActiveNav]       = useState("overview");
  const [toast,           setToast]           = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving,          setSaving]          = useState(false);

  // ── Track window width for responsive layout ──────────────────────────────
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
  localStorage.setItem("adminDarkMode", dark);
}, [dark]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load all data ─────────────────────────────────────────────────────────
  const loadAllData = async () => {
    try {
      const { settings, contestants: rawC, criteria: rawCr } =
        await apiClient.get("/get-all-data");
      setContestName(settings.contest_name ?? "");
      setContestType(settings.contest_type ?? "pageant");
      setAiPrompt(settings.ai_prompt ?? "");
      setJudgeCount(Number(settings.judge_count ?? 3));
      setCalculationType(settings.computation_type ?? "average");
      setIsJudgeLocked(Boolean(settings.is_judge_locked));
      setContestants(
        (rawC || []).map((c) => ({ id: String(c.id), name: c.name, number: c.entry_number }))
      );
      setCriteria(
        (rawCr || []).map((cr) => ({ id: String(cr.id), name: cr.name, weight: Number(cr.percentage) }))
      );
    } catch (err) {
      showToast("error", "Failed to load data: " + err.message);
    }

    try {
      const data = await apiClient.get("/system-config");
      if (data.school_name     !== undefined) setSchoolName(data.school_name ?? "");
      if (data.portal_name     !== undefined) setPortalName(data.portal_name ?? "");
      if (data.school_logo     !== undefined) setSchoolLogo(data.school_logo ?? "");
      if (data.background_logo !== undefined) setBackgroundLogo(data.background_logo ?? "");
      if (data.primary_color   !== undefined) setPrimaryColor(data.primary_color ?? "#22c55e");
      if (data.secondary_color !== undefined) setSecondaryColor(data.secondary_color ?? "#0f172a");
      if (data.footer_text     !== undefined) setFooterText(data.footer_text ?? "");
      if (data.logo_radius     !== undefined) setLogoRadius(Number(data.logo_radius ?? 12));
      if (data.header_template !== undefined) setHeaderTemplate(data.header_template ?? "structured");
    } catch (err) {
      console.error("system-config load error:", err);
    }
  };

  useEffect(() => { loadAllData(); }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  const onSave = async () => {
    setSaving(true);
    try {
      await apiClient.post("/save-config", {
        contest_name:     contestName,
        contest_type:     contestType,
        ai_prompt:        aiPrompt,
        judge_count:      judgeCount,
        computation_type: calculationType,
        is_judge_locked:  isJudgeLocked ? 1 : 0,
        contestants: contestants.map((c)  => ({ name: c.name, entry_number: c.number })),
        criteria:    criteria.map((cr)    => ({ name: cr.name, percentage: cr.weight })),
      });
      await apiClient.post("/save-system-config", {
        school_name:     schoolName,    portal_name:     portalName,
        school_logo:     schoolLogo,    background_logo: backgroundLogo,
        primary_color:   primaryColor,  secondary_color: secondaryColor,
        footer_text:     footerText,    logo_radius:     logoRadius,
        header_template: headerTemplate,
      });
      showToast("success", "Configuration saved!");
      await loadAllData();
    } catch (err) {
      showToast("error", "Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const onDelete = async () => {
    setShowDeleteModal(false);
    try {
      await apiClient.delete("/reset-data");
      Object.keys(localStorage)
        .filter((k) => k.startsWith("ui_html_cache_"))
        .forEach((k) => localStorage.removeItem(k));
      showToast("success", "All data cleared.");
      await loadAllData();
    } catch (err) {
      showToast("error", "Reset failed: " + err.message);
    }
  };

  const totalWeight = criteria.reduce((s, c) => s + Number(c.weight || 0), 0);

  const SaveButton = ({ full }) => (
    <button
      className={`btn-primary flex items-center justify-center gap-2 shrink-0 text-sm transition-opacity ${
        full ? "w-full py-3 px-4" : "w-auto"
      } ${saving ? "opacity-70" : "opacity-100"}`}
      onClick={onSave}
      disabled={saving}
    >
      {saving ? "⏳ Saving…" : <><span>✓</span> Save Config</>}
    </button>
  );

  return (
    <div className={dark ? "dark" : ""}>
      <div className="flex min-h-screen bg-[var(--bg)]">
        {/* ── Sidebar: only render on desktop ─────────────────────────── */}
        {!isMobile && (
          <Sidebar
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            dark={dark}
            setDark={setDark}
          />
        )}

        {/* ── Mobile slide-in drawer: only render on mobile ───────────── */}
        {isMobile && (
          <MobileNavDrawer
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            navItems={navItems}
            dark={dark}
            setDark={setDark}
          />
        )}

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main className="flex flex-1 flex-col overflow-y-auto">
          {/* Mobile top bar: hamburger + current section label */}
          {isMobile && (
            <MobileTopBar
              activeNav={activeNav}
              navItems={navItems}
              onOpenMenu={() => setMobileMenuOpen(true)}
            />
          )}

          {/* Page body */}
          <div
            className={`flex-1 ${
              isMobile ? "px-4 py-5 pb-[88px]" : "px-10 py-9"
            }`}
          >
            {/* Header row */}
            <div
              className={`flex justify-between gap-3 sm:gap-4 mb-5 lg:mb-8 ${
                isMobile ? "flex-col items-stretch" : "flex-row items-start"
              }`}
            >
              <div className="min-w-0">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 bg-[var(--accent-lt)] text-[var(--accent)] border border-[var(--accent-bd)]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-mid)]" />
                  Admin Dashboard
                </div>
                <h1
                  className={`font-extrabold mt-3 lg:mt-0 tracking-tight text-[var(--text1)] max-w-full ${
                    isMobile
                      ? "text-xl leading-tight line-clamp-2 whitespace-normal"
                      : "text-2xl leading-tight overflow-hidden text-ellipsis whitespace-nowrap"
                  }`}
                >
                  {contestName || "Competition Setup"}
                </h1>
              </div>

              {/* Save button lives inline on desktop; on mobile it's a sticky bottom bar instead */}
              {!isMobile && <SaveButton />}
            </div>

            <div className="h-px mb-8 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

            <SectionRender
              activeNav={activeNav}
              contestName={contestName}         setContestName={setContestName}
              contestType={contestType}         setContestType={setContestType}
              aiPrompt={aiPrompt}               setAiPrompt={setAiPrompt}
              judgeCount={judgeCount}           setJudgeCount={setJudgeCount}
              calculationType={calculationType} setCalculationType={setCalculationType}
              isJudgeLocked={isJudgeLocked}     setIsJudgeLocked={setIsJudgeLocked}
              criteria={criteria}               setCriteria={setCriteria}
              contestants={contestants}         setContestants={setContestants}
              newCrit={newCrit}                 setNewCrit={setNewCrit}
              newWeight={newWeight}             setNewWeight={setNewWeight}
              newName={newName}                 setNewName={setNewName}
              totalWeight={totalWeight}
              setShowDeleteModal={setShowDeleteModal}
              schoolName={schoolName}           setSchoolName={setSchoolName}
              portalName={portalName}           setPortalName={setPortalName}
              schoolLogo={schoolLogo}           setSchoolLogo={setSchoolLogo}
              backgroundLogo={backgroundLogo}   setBackgroundLogo={setBackgroundLogo}
              primaryColor={primaryColor}       setPrimaryColor={setPrimaryColor}
              secondaryColor={secondaryColor}   setSecondaryColor={setSecondaryColor}
              footerText={footerText}           setFooterText={setFooterText}
              logoRadius={logoRadius}           setLogoRadius={setLogoRadius}
              headerTemplate={headerTemplate}   setHeaderTemplate={setHeaderTemplate}
            />
          </div>
        </main>
      </div>

      {/* Sticky mobile save bar — always reachable, never overlapped */}
      {isMobile && (
        <div className="fixed left-0 right-0 bottom-0 z-40 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] bg-[var(--bg)] border-t border-[var(--border)] shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <SaveButton full />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`save-toast ${toast.type === "error" ? "bg-[#be123c]" : ""} ${
            isMobile ? "bottom-[76px]" : ""
          }`}
        >
          <span>{toast.type === "error" ? "✗" : "✓"}</span> {toast.msg}
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        title="Reset System Data?"
        message="DANGER: This will permanently delete all contestants, criteria, and scores. This action cannot be undone."
        onConfirm={onDelete}
        onCancel={() => setShowDeleteModal(false)}
        type="danger"
      />
    </div>
  );
}

export default Dashboard;