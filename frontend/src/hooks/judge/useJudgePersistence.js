import { useRef } from 'react';

export const useJudgePersistence = (selectedJudge, contestants) => {
  const scoreCache = useRef({});
  const getStorageKey = () => `backup_scores_judge_${selectedJudge}`;

  const saveToCache = (id, value) => {
    scoreCache.current[id] = value;
    localStorage.setItem(getStorageKey(), JSON.stringify(scoreCache.current));
  };

  const loadCache = () => {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) scoreCache.current = JSON.parse(saved);
    return scoreCache.current;
  };

  const clearCache = () => {
    localStorage.removeItem(getStorageKey());
    scoreCache.current = {};
  };

  return { scoreCache, saveToCache, loadCache, clearCache };
};