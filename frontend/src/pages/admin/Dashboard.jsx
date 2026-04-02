import { useState, useEffect } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import SectionRender from '../../components/admin/sectionRender';
import { Modal } from '../../components/admin/Modal';
import {loadAllData } from '../../hooks/admin/loadData';
import { handleDeleteAllData } from '../../hooks/admin/handleDelete';
import { handleSaveData } from '../../hooks/admin/handlesave';

// Import split logic


function Dashboard() {
  const [dark, setDark] = useState(false);

  // config state
  const [contestName, setContestName] = useState('');
  const [contestType, setContestType] = useState('pageant');
  const [aiPrompt, setAiPrompt] = useState('');
  const [judgeCount, setJudgeCount] = useState(3);
  const [calculationType, setCalculationType] = useState('average'); 
  const [isJudgeLocked, setIsJudgeLocked] = useState(false); // ── ADDED ──
  const [criteria, setCriteria] = useState([]); 
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newCrit, setNewCrit] = useState('');
  const [newWeight, setNewWeight] = useState(10);
  const [contestants, setContestants] = useState([]); 

  const [newName, setNewName] = useState('');
  const [activeNav, setActiveNav] = useState('overview');
  const [toast, setToast] = useState(false);

  // ── BACKEND CONFIG ──
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

  const setters = {
    setContestName, setContestType, setAiPrompt, setJudgeCount,
    setCalculationType, setIsJudgeLocked, setContestants, setCriteria
  };

  useEffect(() => {
    loadAllData(API_BASE, setters);
  }, []);

  const totalWeight = criteria.reduce((s, c) => s + Number(c.weight || 0), 0);

  const onSave = () => {
    const data = { 
        contestName, contestType, aiPrompt, judgeCount, 
        calculationType, isJudgeLocked, contestants, criteria 
    };
    const helpers = { setToast, loadAllData: () => loadAllData(API_BASE, setters) };
    handleSaveData(API_BASE, data, helpers);
  };

  const onDelete = () => {
    handleDeleteAllData(API_BASE, { setShowDeleteModal, setToast });
  };

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="dash-root flex" style={{ minHeight: '100vh' }}>
        <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} dark={dark} setDark={setDark} />

        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)', padding: '36px 40px' }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
                Admin Dashboard
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-.02em' }}>
                {contestName || 'Competition Setup'}
              </h1>
            </div>
            <button className="btn-primary" onClick={onSave}>
              <span>✓</span> Save Config
            </button>
          </div>

          <SectionRender 
            activeNav={activeNav}
            contestName={contestName} setContestName={setContestName}
            contestType={contestType} setContestType={setContestType}
            aiPrompt={aiPrompt} setAiPrompt={setAiPrompt}
            judgeCount={judgeCount} setJudgeCount={setJudgeCount}
            calculationType={calculationType} setCalculationType={setCalculationType}
            isJudgeLocked={isJudgeLocked} setIsJudgeLocked={setIsJudgeLocked} // ── ADDED ──
            criteria={criteria} setCriteria={setCriteria}
            contestants={contestants} setContestants={setContestants}
            newCrit={newCrit} setNewCrit={setNewCrit}
            newWeight={newWeight} setNewWeight={setNewWeight}
            newName={newName} setNewName={setNewName}
            totalWeight={totalWeight}
            setShowDeleteModal={setShowDeleteModal}
          />

        </main>
      </div>

      {toast && (
        <div className="save-toast">
          <span>✓</span> Configuration saved!
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