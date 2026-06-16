import { useState, useEffect } from "react";
import {getSchoolId} from '../../utils/judge'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export function useContestName(configSettingsName, pollInterval = 5000) {
  const [contestName, setContestName] = useState(configSettingsName || '');
 
  useEffect(() => {
    if (configSettingsName) setContestName(configSettingsName);
  }, [configSettingsName]);

  useEffect(() => {
    const schoolId = getSchoolId();
    const poll = async () => {
      try {
        const res  = await fetch(`${API_BASE}/public/get-all-data?school_id=${schoolId}`);
        const data = await res.json();
        if (data && !data.error) {
          const name = data.settings?.contest_name || '';
          if (name) setContestName(name);
        }
      } catch {
        // silent
      }
    };
    const interval = setInterval(poll, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  return contestName;
}