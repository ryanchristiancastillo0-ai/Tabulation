
import { useState, useEffect, useRef } from "react";
import {getSchoolId} from '../../utils/judge'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export function useJudgeLockState(pollInterval = 4000) {
  const [isJudgeLocked, setIsJudgeLocked] = useState(false);
  const lockedRef = useRef(false);

  useEffect(() => {
    const schoolId = getSchoolId();
    const poll = async () => {
      try {
        const res  = await fetch(`${API_BASE}/public/get-all-data?school_id=${schoolId}`);
        const data = await res.json();
        if (data && !data.error) {
          const settings = data.settings || {};
          const serverLocked =
            settings.is_judge_locked === 1 ||
            settings.is_judge_locked === true ||
            settings.is_judge_locked === '1';
          if (serverLocked !== lockedRef.current) {
            lockedRef.current = serverLocked;
            setIsJudgeLocked(serverLocked);
          }
        }
      } catch (err) {
        console.warn('[JudgeTable] lock poll error:', err.message);
      }
    };
    poll();
    const interval = setInterval(poll, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  return isJudgeLocked;
}