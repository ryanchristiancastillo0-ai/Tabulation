import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ChevronRight, LogOut, TrophyIcon, Moon, Sun
} from 'lucide-react';
import CriteriaManager from './CreteriaManager';
import { useContestContext } from '../../providers/ContestContext';
import {
  AIConfigSection, ContestantsSection,
  ContestInfoSection, OverviewSection,
  SystemConfigSection, JudgesSection
} from './index';

// ─── MOBILE NAV DRAWER ────────────────────────────────────────────────────────

export const MobileNavDrawer = ({ isOpen, onClose, activeNav, setActiveNav, navItems, dark, setDark }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/login";
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[80] bg-black/45 transition-opacity duration-250 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-[90] w-[260px] flex flex-col overflow-y-auto
          bg-[var(--surface)] border-r border-[var(--border)] shadow-[4px_0_24px_rgba(0,0,0,0.12)]
          transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--accent-lt)]">
          <span className="font-extrabold text-[15px] text-[var(--accent)]">Navigation</span>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-lg border-none bg-[var(--surface)] cursor-pointer flex items-center justify-center text-[var(--text2)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 p-3">
          {navItems.map(item => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); onClose(); }}
                className={`w-full flex items-center gap-3 px-3.5 py-[11px] rounded-xl border-none mb-0.5
                  cursor-pointer font-[inherit] text-sm transition-all duration-150
                  ${isActive
                    ? 'bg-[var(--accent-lt)] text-[var(--accent)] font-bold'
                    : 'bg-transparent text-[var(--text2)] font-medium'}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                  ${isActive
                    ? 'bg-[var(--accent-bd)] text-[var(--accent)]'
                    : 'bg-[var(--surface2)] text-[var(--text3)]'}`}
                >
                  {item.icon}
                </div>
                {item.label}
                {isActive && (
                  <ChevronRight size={14} className="ml-auto text-[var(--accent)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Bottom actions ── */}
        <div className="border-t border-[var(--border)] px-2.5 pt-3 pb-2 flex flex-col gap-1">

          {/* Leaderboard */}
          <button
            onClick={() => { navigate('/admin/leaderboard'); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent
              bg-transparent text-[var(--text2)] text-sm font-semibold cursor-pointer font-[inherit]
              transition-all duration-150 hover:bg-[#fff1f2] hover:text-[#be123c] hover:border-[#fecdd3]"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[var(--surface2)]">
              <TrophyIcon size={15} />
            </div>
            Leaderboard
          </button>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent
              bg-transparent text-[var(--text2)] text-sm font-semibold cursor-pointer font-[inherit]
              transition-all duration-150 hover:bg-[#fff1f2] hover:text-[#be123c] hover:border-[#fecdd3]"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[var(--surface2)]">
              <LogOut size={15} />
            </div>
            Sign Out
          </button>

          {/* Dark / Light toggle */}
          <button
            onClick={() => setDark(!dark)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl
              border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)]
              text-sm font-medium cursor-pointer font-[inherit]"
          >
            <span>{dark ? 'Dark Mode' : 'Light Mode'}</span>
            {dark
              ? <Moon size={15} className="text-[var(--accent)]" />
              : <Sun size={15} className="text-[var(--accent)]" />}
          </button>
        </div>
      </div>
    </>
  );
};

// ─── MAIN RENDER ──────────────────────────────────────────────────────────────

const SectionRender = ({
  activeNav,
  contestName, setContestName,
  contestType, setContestType,
  aiPrompt, setAiPrompt,
  judgeCount, setJudgeCount,
  calculationType, setCalculationType,
  criteria, setCriteria,
  contestants, setContestants,
  newCrit, setNewCrit,
  newWeight, setNewWeight,
  newName, setNewName,
  totalWeight,
  setShowDeleteModal,
  schoolName, setSchoolName,
  portalName, setPortalName,
  schoolLogo, setSchoolLogo,
  backgroundLogo, setBackgroundLogo,
  primaryColor, setPrimaryColor,
  secondaryColor, setSecondaryColor,
  footerText, setFooterText,
  logoRadius, setLogoRadius,
  headerTemplate, setHeaderTemplate,
}) => {
  const { isJudgeLocked } = useContestContext();

  const addCriterion = () => {
    if (!newCrit.trim()) return;
    setCriteria([...criteria, { id: Date.now().toString(), name: newCrit.trim(), weight: Number(newWeight) }]);
    setNewCrit('');
    setNewWeight(10);
  };

  const addContestant = () => {
    if (!newName.trim()) return;
    const num = contestants.length + 1;
    setContestants([...contestants, { id: Date.now().toString(), name: newName.trim(), number: num }]);
    setNewName('');
  };

  return (
    <>
      {activeNav === 'overview' && (
        <OverviewSection
          contestants={contestants} judgeCount={judgeCount} criteria={criteria}
          totalWeight={totalWeight} contestName={contestName} contestType={contestType}
          calculationType={calculationType} aiPrompt={aiPrompt} isJudgeLocked={isJudgeLocked}
          setShowDeleteModal={setShowDeleteModal}
          schoolLogo={schoolLogo} backgroundLogo={backgroundLogo}
          schoolName={schoolName} portalName={portalName} logoRadius={logoRadius}
        />
      )}
      {activeNav === 'contest' && (
        <ContestInfoSection contestName={contestName} setContestName={setContestName} contestType={contestType} setContestType={setContestType} />
      )}
      {activeNav === 'ai' && (
        <AIConfigSection aiPrompt={aiPrompt} setAiPrompt={setAiPrompt} />
      )}
      {activeNav === 'criteria' && (
        <CriteriaManager criteria={criteria} setCriteria={setCriteria} newCrit={newCrit} setNewCrit={setNewCrit} addCriterion={addCriterion} />
      )}
      {activeNav === 'judges' && (
        <JudgesSection
          judgeCount={judgeCount} setJudgeCount={setJudgeCount}
          calculationType={calculationType} setCalculationType={setCalculationType}
        />
      )}
      {activeNav === 'contestants' && (
        <ContestantsSection contestants={contestants} setContestants={setContestants} newName={newName} setNewName={setNewName} addContestant={addContestant} />
      )}
      {activeNav === 'system' && (
        <SystemConfigSection
          schoolName={schoolName} setSchoolName={setSchoolName}
          portalName={portalName} setPortalName={setPortalName}
          schoolLogo={schoolLogo} setSchoolLogo={setSchoolLogo}
          backgroundLogo={backgroundLogo} setBackgroundLogo={setBackgroundLogo}
          primaryColor={primaryColor} setPrimaryColor={setPrimaryColor}
          secondaryColor={secondaryColor} setSecondaryColor={setSecondaryColor}
          footerText={footerText} setFooterText={setFooterText}
          logoRadius={logoRadius} setLogoRadius={setLogoRadius}
          headerTemplate={headerTemplate} setHeaderTemplate={setHeaderTemplate}
        />
      )}
    </>
  );
};

export default SectionRender;