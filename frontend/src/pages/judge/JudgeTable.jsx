
import { WifiOff } from 'lucide-react';
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

  return (
    <div className="judge-terminal p-8 max-w-7xl mx-auto min-h-screen">
      <StatusModal 
        isOpen={modal.show} 
        title={modal.title} 
        message={modal.message} 
        type={modal.type} 
        onClose={closeModal} 
      />

      {!isOnline && (
        <div className="bg-rose-500 text-white p-2 rounded-xl text-center mb-4 flex items-center justify-center gap-2 animate-pulse">
          <WifiOff size={16} /> 
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Disconnected - Local Backup Active
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-8 py-5 bg-white border-b border-slate-100 shadow-sm rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <h2 className="text-[15px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1">
              Judge Terminal
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-medium text-slate-400 tracking-wide">
                {config.settings?.contest_name || "Offline"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedJudge}
            onChange={(e) => updateJudge(e.target.value)}
            className="judge-select p-2 border rounded-lg text-sm font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Judge</option>
            {Array.from({ length: config.settings?.judge_count || 0 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Judge {i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Terminal Area */}
      <div className="terminal-panel overflow-x-auto min-h-[450px] bg-slate-900 rounded-3xl shadow-2xl border border-slate-800">
        <div className="terminal-panel-bar p-4 flex gap-2 border-b border-slate-800">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-32 text-indigo-400 font-mono italic">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mr-3" />
              Generating Dynamic UI...
            </div>
          ) : (
            <div className="ai-generated-ui" dangerouslySetInnerHTML={{ __html: dynamicUI }} />
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-10 flex flex-col items-center gap-4">
        <button 
          onClick={submitToDB} 
          disabled={!selectedJudge || loading} 
          className="submit-btn px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Final Scores
        </button>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Autosave Active • Backup for Judge #{selectedJudge || '?'}
        </p>
      </div>
    </div>
  );
};

export default JudgeTable;