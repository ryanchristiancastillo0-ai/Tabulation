import React, { useState } from 'react';
import { Trash2, Plus, Check, Edit3, AlertCircle, LayoutGrid } from 'lucide-react';

export default function CriteriaManager({ 
  criteria, 
  setCriteria, 
  newCrit, 
  setNewCrit, 
  addCriterion 
}) {
  const [isAdding, setIsAdding] = useState(false);

  const totalWeight = criteria.reduce((s, c) => s + Number(c.weight || 0), 0);
  const isComplete = totalWeight === 100;

  // --- CRUD Actions ---
  const handleInternalAdd = () => {
    if (!newCrit.trim()) return;
    addCriterion(); // Calls the function from Dashboard.jsx
    setIsAdding(false);
  };

  const updateField = (id, field, val) => {
    if (field === 'weight') {
      const numericVal = Math.max(0, Number(val) || 0);
      const otherTotal = criteria
        .filter(c => c.id != id)
        .reduce((s, c) => s + Number(c.weight || 0), 0);
      
      if (otherTotal + numericVal > 100) return; 
      val = numericVal;
    }
    setCriteria(criteria.map(c => c.id == id ? { ...c, [field]: val } : c));
  };

  const removeCriteria = (id) => {
    setCriteria(criteria.filter(c => c.id != id));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      
      {/* Header & Progress */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Scoring Matrix</h3>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Weight Distribution</p>
            </div>
          </div>
          
          <div className="text-right">
            <span className={`text-xl font-bold ${isComplete ? 'text-emerald-600' : 'text-slate-900'}`}>
              {totalWeight}%
            </span>
            <div className="h-1 w-24 bg-slate-200 rounded-full mt-1 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${isComplete ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                style={{ width: `${totalWeight}%` }}
              />
            </div>
          </div>
        </div>

        {/* Add Logic */}
        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-3 h-3" /> Add Criterion
          </button>
        ) : (
          <div className="flex gap-2">
            <input 
              autoFocus
              type="text"
              placeholder="Criterion Name"
              value={newCrit}
              onChange={(e) => setNewCrit(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInternalAdd()}
              className="flex-1 px-3 py-2 rounded-md border border-slate-300 text-sm focus:border-indigo-500 outline-none"
            />
            <button onClick={handleInternalAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-md font-bold text-xs hover:bg-indigo-700">
              Add
            </button>
            <button onClick={() => setIsAdding(false)} className="px-3 py-2 text-slate-400 font-bold text-xs">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="p-4 space-y-2">
        {criteria.length === 0 && !isAdding && (
          <div className="py-8 text-center text-slate-400 text-xs font-medium italic">
            No criteria added.
          </div>
        )}

        {criteria.map((c) => (
          <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 bg-white">
            <div className="flex-1 flex items-center gap-2">
              <Edit3 className="w-3 h-3 text-slate-300" />
              <input 
                type="text"
                value={c.name}
                onChange={(e) => updateField(c.id, 'name', e.target.value)}
                className="bg-transparent border-none p-0 font-bold text-slate-800 text-sm focus:ring-0 w-full outline-none"
              />
            </div>

            <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
              <input 
                type="number"
                value={c.weight || ''}
                onChange={(e) => updateField(c.id, 'weight', e.target.value)}
                className="w-14 py-1 px-2 rounded border border-slate-200 font-bold text-indigo-600 text-right text-sm outline-none"
              />
              <span className="text-xs font-bold text-slate-400">%</span>
              <button 
                onClick={() => removeCriteria(c.id)}
                className="ml-2 p-1 text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={`px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest ${isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
        {isComplete ? 'Configuration Valid' : 'Total must equal 100%'}
      </div>
    </div>
  );
}