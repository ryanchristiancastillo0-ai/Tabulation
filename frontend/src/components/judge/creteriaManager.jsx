import React from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCriteriaGenerator } from '../../hooks/admin/useCriteriaGenerator';

const CriteriaManager = () => {
  const { 
    criteria, newCriterion, setNewCriterion, 
    addCriterion, removeCriterion, totalPercentage, error 
  } = useCriteriaGenerator();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-8 bg-indigo-600 text-white">
          <h2 className="text-2xl font-black uppercase tracking-tight">Criteria Generator</h2>
          <p className="text-indigo-100 text-sm">Define your scoring rules and percentages.</p>
        </div>

        <div className="p-8">
          {/* Input Row */}
          <div className="flex gap-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Criterion Name</label>
              <input 
                type="text"
                placeholder="e.g. Stage Presence"
                value={newCriterion.name}
                onChange={(e) => setNewCriterion({...newCriterion, name: e.target.value})}
                className="w-full p-3 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              />
            </div>
            <div className="w-32">
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Weight (%)</label>
              <input 
                type="number"
                placeholder="0"
                value={newCriterion.percentage}
                onChange={(e) => setNewCriterion({...newCriterion, percentage: e.target.value})}
                className="w-full p-3 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
              />
            </div>
            <button 
              onClick={addCriterion}
              className="mt-6 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-xl flex items-center gap-2 text-sm font-bold">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* Criteria Table */}
          <div className="space-y-3">
            {criteria.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-800">{c.name}</h3>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Maximum Score: {c.percentage} pts</p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xl font-black text-indigo-600">{c.percentage}%</span>
                  <button 
                    onClick={() => removeCriterion(c.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Progress */}
          <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Configuration</p>
              <div className="flex items-center gap-2">
                <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${totalPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${totalPercentage}%` }}
                  />
                </div>
                <span className={`text-sm font-black ${totalPercentage === 100 ? 'text-emerald-500' : 'text-slate-600'}`}>
                  {totalPercentage}/100%
                </span>
              </div>
            </div>

            {totalPercentage === 100 && (
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-full">
                <CheckCircle2 size={16} /> Ready for Judging
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriteriaManager;