// hooks/index.js — aggregate barrel for the hooks layer.
export { useDashboardData } from './useDashboard';
export { useConnectivity } from './useConnectivity';
export { useCriteriaGenerator } from './useCriteria';
export { useJudgePersistence } from './useJudgePersistence';
export { useJudgeSystem } from './useJudgeSystem';
export { useSystemConfig } from './useSystemConfig';
export { loadAllData } from './loadData';
export { handleSaveData } from './handleSave';
export { handleDeleteAllData } from './handleDelete';
export { getHydra_and_Calcu, sanitizeAiHtml } from './getHydration_and_Calculation';