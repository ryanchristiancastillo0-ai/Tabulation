import apiClient from '..//utils/apiClient';  // ← add this import at the top
import { getSchoolId } from '../utils/getSchoolId';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const getJudgeDataFetch = async (setLoading, setConfig, setDynamicUI, showStatus) => {
  setLoading(true);
  try {
    const school_id = getSchoolId();

    const res = await fetch(`${API_BASE}/public/get-all-data?school_id=${school_id}`);
    if (!res.ok) {
      showStatus('Error', `Failed to load contest data (${res.status}).`, 'error');
      return;
    }

    const data = await res.json();
    setConfig(data);

    // ← replaced raw fetch with apiClient (auto-attaches token)
    const uiData = await apiClient.post('/judge/render-ui', {
      school_id,
      aiPrompt:    data.settings?.ai_prompt || 'Modern and Professional',
      contestants: data.contestants  || [],
      criteria:    data.criteria     || [],
    });

    setDynamicUI(uiData);

  } catch (err) {
    showStatus('Error', err.message || 'System offline or server unreachable.', 'warning');
  } finally {
    setLoading(false);
  }
};