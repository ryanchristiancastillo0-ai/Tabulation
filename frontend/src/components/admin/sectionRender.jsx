import React, { useState, useEffect, useRef } from 'react';
import {
 X, ChevronRight,
} from 'lucide-react';
import CriteriaManager from './CreteriaManager';
import { useContestContext } from '../../providers/ContestContext';
import {AIConfigSection,ContestantsSection,
 ContestInfoSection,
  OverviewSection,SystemConfigSection,JudgesSection} from './index'



// ─── MOBILE NAV DRAWER ────────────────────────────────────────────────────────

export const MobileNavDrawer = ({ isOpen, onClose, activeNav, setActiveNav, navItems }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 80,
          background: 'rgba(0,0,0,0.45)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s',
        }}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 90,
          width: 260,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Drawer header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--accent-lt)',
        }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent)' }}>Navigation</span>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: 'var(--surface)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text2)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <div style={{ padding: '12px 10px', flex: 1 }}>
          {navItems.map(item => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); onClose(); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 10, border: 'none',
                  marginBottom: 2, cursor: 'pointer', fontFamily: 'inherit',
                  background: isActive ? 'var(--accent-lt)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text2)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 14,
                  transition: 'all .15s',
                }}
              >
                <span style={{ color: isActive ? 'var(--accent)' : 'var(--text3)', display: 'flex' }}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

// ─── MOBILE TOP BAR ───────────────────────────────────────────────────────────



// ─── OVERVIEW ────────────────────────────────────────────────────────────────


// ─── CONTEST INFO ─────────────────────────────────────────────────────────────

// ─── AI CONFIG ────────────────────────────────────────────────────────────────


// ─── JUDGES ───────────────────────────────────────────────────────────────────


// ─── CONTESTANTS ──────────────────────────────────────────────────────────────



// ─── LOGO UPLOAD FIELD ────────────────────────────────────────────────────────


// ─── HEADER TEMPLATES ─────────────────────────────────────────────────────────


// ─── SYSTEM CONFIG ────────────────────────────────────────────────────────────



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