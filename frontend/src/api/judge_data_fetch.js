export const getJudgeDataFetch = async (API_BASE, setLoading, setConfig, setDynamicUI, showStatus) => {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/get-all-data`);
    const data = await res.json();
    setConfig(data);

    const uiRes = await fetch(`${API_BASE}/judge/render-ui`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
  aiPrompt: data.settings?.ai_prompt || "Modern and Professional",
  contestants: data.contestants,
  criteria: data.criteria
})
    });

    const uiData = await uiRes.json();
   setDynamicUI(uiData);
  } catch (err) {
    showStatus("Error", "System offline.", "warning");
  } finally {
    setLoading(false);
  }
};