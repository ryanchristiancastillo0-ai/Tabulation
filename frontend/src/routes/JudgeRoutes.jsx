import { Route } from 'react-router-dom';
import JudgeTable from '../pages/judge/Judging';
import JudgeScoreboard from '../pages/judge/Scores';
import { JudgeProtectedRoute } from './ProtectedRoute';

export default function JudgeRoutes() {
  return (
    <Route element={<JudgeProtectedRoute />}>
      <Route path="/judge" element={<JudgeTable />} />
      <Route path="/judge/scoreboard" element={<JudgeScoreboard />} />
    </Route>
  );
}