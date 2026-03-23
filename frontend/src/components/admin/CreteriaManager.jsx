import React, { useState } from 'react';
import { Trash2, Plus, Check, Edit3, AlertCircle, LayoutGrid } from 'lucide-react';

export default function CriteriaManager({ criteria, setCriteria }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCriteriaName, setNewCriteriaName] = useState('');

  const totalWeight = criteria.reduce((s, c) => s + Number(c.weight), 0);
  const isComplete = totalWeight === 100;

  // --- CRUD Actions ---

  const handleAdd = () => {
    if (!newCriteriaName.trim()) return;
    
    const newItem = {
      id: Date.now(),
      name: newCriteriaName,
      weight: 0
    };

    setCriteria([...criteria, newItem]);
    setNewCriteriaName('');
    setIsAdding(false);
  };

  const updateField = (id, field, val) => {
    if (field === 'weight') {
      const numericVal = Math.max(0, Number(val) || 0);
      const otherTotal = criteria.filter(c => c.id !== id).reduce((s, c) => s + Number(c.weight), 0);
      if (otherTotal + numericVal > 100) return; // Block if > 100
      val = numericVal;
    }

    setCriteria(criteria.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const removeCriteria = (id) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
      
      {/* 1. Header & Progress */}
      <div className="p-8 border-b border-slate-100 bg-slate-50/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Scoring Matrix</h3>
              <p className="text-xs text-slate-500 font-medium">Manage criteria and weight distribution</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <span className={`text-2xl font-black tabular-nums ${isComplete ? 'text-emerald-600' : 'text-slate-900'}`}>
              {totalWeight}%
            </span>
            <div className={`h-1.5 w-32 bg-slate-200 rounded-full mt-2 overflow-hidden`}>
              <div 
                className={`h-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                style={{ width: `${totalWeight}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Add Action */}
        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 text-sm font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Criterion
          </button>
        ) : (
          <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <input 
              autoFocus
              type="text"
              placeholder="Enter criterion name (e.g. Creativity)"
              value={newCriteriaName}
              onChange={(e) => setNewCriteriaName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-indigo-100 bg-white text-sm focus:border-indigo-500 outline-none shadow-inner"
            />
            <button onClick={handleAdd} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md">
              Confirm
            </button>
            <button onClick={() => setIsAdding(false)} className="px-4 py-3 text-slate-400 font-bold text-sm hover:text-slate-600">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* 3. CRUD List */}
      <div className="p-4 sm:p-8 space-y-3">
        {criteria.length === 0 && !isAdding && (
          <div className="py-12 flex flex-col items-center opacity-40">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="text-sm font-medium">No criteria defined yet</p>
          </div>
        )}

        {criteria.map((c) => (
          <div 
            key={c.id} 
            className="group flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-50/50 transition-all bg-white"
          >
            {/* Editable Name Field */}
            <div className="flex-1 relative">
              <label className="text-[10px] uppercase font-black text-slate-300 tracking-widest mb-1 block">Criterion Name</label>
              <div className="flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                <input 
                  type="text"
                  value={c.name}
                  onChange={(e) => updateField(c.id, 'name', e.target.value)}
                  className="bg-transparent border-none p-0 font-bold text-slate-800 focus:ring-0 w-full text-base outline-none"
                />
              </div>
            </div>

            {/* Weight Input */}
            <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-50 pt-4 sm:pt-0 sm:pl-6">
              <div className="relative">
                <label className="text-[10px] uppercase font-black text-slate-300 tracking-widest mb-1 block">Weight</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    value={c.weight || ''}
                    onChange={(e) => updateField(c.id, 'weight', e.target.value)}
                    className="w-20 py-1.5 px-3 rounded-lg border border-slate-200 font-bold text-indigo-600 text-right focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all tabular-nums"
                  />
                  <span className="text-sm font-bold text-slate-400">%</span>
                </div>
              </div>

              {/* Delete Action */}
              <button 
                onClick={() => removeCriteria(c.id)}
                className="mt-4 sm:mt-0 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Validation Footer */}
      <div className={`px-8 py-4 flex items-center justify-center gap-2 transition-colors ${isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
        {isComplete ? (
          <><Check className="w-4 h-4" /> Configuration Valid</>
        ) : (
          <p className="text-[11px] font-bold uppercase tracking-widest">
            Total must equal 100% to save configuration
          </p>
        )}
      </div>
    </div>
  );
}