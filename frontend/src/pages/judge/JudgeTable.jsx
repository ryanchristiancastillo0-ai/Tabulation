import React from 'react';
import { WifiOff, Lock, ShieldCheck, Activity } from 'lucide-react';
import { StatusModal } from '../../components/judge/StatusModal';
import { useJudgeSystem } from '../../hooks/judge/useJudgeSystem';

const JudgeTable = () => {
  const {
    selectedJudge,
    dynamicUI,
    config,
    loading,
    modal,
    isOnline,
    closeModal,
    submitToDB,
    updateJudge
  } = useJudgeSystem();

  const isLocked = config.settings?.is_judge_locked === 1 || config.settings?.is_judge_locked === true;

  // --- Support both String (Old) and Object (New) formats ---
  const headerHtml = dynamicUI?.headerHtml || '';
  const tableHtml = typeof dynamicUI === 'string' ? dynamicUI : (dynamicUI?.html || '');

  return (
    <div className="judge-terminal p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <StatusModal 
        isOpen={modal.show} 
        title={modal.title} 
        message={modal.message} 
        type={modal.type} 
        onClose={closeModal} 
      />

      {!isOnline && (
        <div className="bg-rose-500 text-white p-2 rounded-xl text-center mb-4 flex items-center justify-center gap-2 animate-pulse shadow-lg">
          <WifiOff size={16} /> 
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">Offline Mode</span>
        </div>
      )}

      {/* TOP NAV BAR 
          Removed hardcoded bg-white. Added glassmorphism so it adapts 
          to whatever background color the AI sets for the page.
      */}
      <div className="flex items-center justify-between mb-8 px-6 py-4 backdrop-blur-md bg-white/10 border border-white/20 shadow-xl rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-lg">
            <div className="text-white font-bold">
               {isLocked ? <Lock size={20} /> : <Activity size={20} />}
            </div>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-tighter opacity-70">
              Terminal v2.0
            </h2>
            <p className="text-sm font-bold truncate max-w-[150px] md:max-w-none">
              {config.settings?.contest_name || "Syncing..."}
            </p>
          </div>
        </div>

        <div className="relative">
          <select
            value={selectedJudge}
            disabled={isLocked}
            onChange={(e) => updateJudge(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 bg-white/20 border border-white/30 rounded-lg text-sm font-bold outline-none backdrop-blur-md focus:ring-2 focus:ring-white/50 transition-all"
          >
            <option value="" className="text-slate-900">
              {isLocked ? "LOCKED" : "SELECT JUDGE"}
            </option>
            {Array.from({ length: config.settings?.judge_count || 0 }, (_, i) => (
              <option key={i + 1} value={i + 1} className="text-slate-900">Judge {i + 1}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
            <ShieldCheck size={14} />
          </div>
        </div>
      </div>

      {/* AI GENERATED CRITERIA (The Pink Cards/Badges) */}
      {!loading && headerHtml && (
        <div 
          className="dynamic-header-area mb-8" 
          dangerouslySetInnerHTML={{ __html: headerHtml }} 
        />
      )}

      {/* AI GENERATED TABLE (The Pink Table) */}
      <div className="dynamic-table-area shadow-2xl rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-4" />
            <p className="font-mono text-xs uppercase tracking-widest">Building Interface...</p>
          </div>
        ) : (
          <div 
            className="ai-rendered-content" 
            dangerouslySetInnerHTML={{ __html: tableHtml }} 
          />
        )}
      </div>

      {/* FOOTER ACTION */}
      <div className="mt-12 flex flex-col items-center gap-6">
        <button 
          onClick={submitToDB} 
          disabled={!selectedJudge || loading || isLocked} 
          className="group relative px-16 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
        >
          <span className="relative z-10 uppercase tracking-widest">Submit Scores</span>
          <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        
        <div className="flex items-center gap-2 opacity-40">
          <div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">
            {isLocked ? "System Locked" : "Encrypted Connection Active"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default JudgeTable;