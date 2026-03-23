import { useState, useEffect } from 'react';

const JudgeTable = () => {
  const [selectedJudge, setSelectedJudge] = useState('');
  const [dynamicUI, setDynamicUI] = useState(''); 
  const [config, setConfig] = useState({ contestants: [], criteria: [], settings: {} });
  const [loading, setLoading] = useState(false);

  const API_BASE = "http://localhost:8080/api";

  useEffect(() => {
    const loadSystem = async () => {
      setLoading(true);
      try {
        // 1. Get raw data
        const res = await fetch(`${API_BASE}/get-all-data`);
        const data = await res.json();
        setConfig(data);
        
        // 2. Post data to AI to get HTML
        const uiRes = await fetch(`${API_BASE}/judge/render-ui`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: data.settings.ai_prompt,
            contestants: data.contestants,
            criteria: data.criteria
          })
        });
        const uiData = await uiRes.json();
        console.log(uiRes)
        setDynamicUI(uiData.html);
      } catch (err) {
        console.error("Initialization failed", err);
      } finally {
        setLoading(false);
      }
    };
    loadSystem();
  }, []);

  const submitToDB = async () => {
    if (!selectedJudge) return alert("Please select your Judge ID first!");
    
    const payload = []; 
    // Scraping logic: Look for the IDs we told the AI to create
    config.contestants.forEach(con => {
      config.criteria.forEach(crit => {
        const input = document.getElementById(`score-${con.id}-${crit.id}`);
        if (input) {
          payload.push({
            contestantId: con.id,
            criterionId: crit.id,
            value: parseFloat(input.value) || 0
          });
        }
      });
    });

    try {
      const res = await fetch(`${API_BASE}/judge/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judgeId: selectedJudge, scores: payload })
      });
      if (res.ok) alert("Scores submitted successfully!");
    } catch (err) {
      alert("Submission failed.");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl shadow-sm border">
        <h2 className="text-xl font-bold">Judge Panel</h2>
        
        <select 
          onChange={(e) => setSelectedJudge(e.target.value)} 
          className="border p-2 rounded-lg bg-gray-50 font-medium"
        >
          <option value="">Identify Yourself...</option>
          {Array.from({ length: config.settings.judge_count || 0 }, (_, i) => (
            <option key={i+1} value={i+1}>Judge {i+1}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">AI is generating your interface...</div>
      ) : (
        <div 
          className="ai-generated-ui"
          dangerouslySetInnerHTML={{ __html: dynamicUI }} 
        />
      )}

      {selectedJudge && !loading && (
        <div className="mt-10 flex justify-end">
          <button 
            onClick={submitToDB} 
            className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition"
          >
            Finalize & Submit Scores
          </button>
        </div>
      )}
    </div>
  );
};

export default JudgeTable;