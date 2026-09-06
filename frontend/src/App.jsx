import { Route, Routes, Navigate, Outlet } from 'react-router-dom'
import './index.css'
import Home from './pages/Home/home'
import JudgeTable from './pages/judge/JudgeTable'
import Dashboard from './pages/admin/Dashboard'
import JudgeScoreboard from './pages/judge/JudgeScoreboard'
import LeaderBoard from './pages/Leaderboard/Leaderboard'
import AdminLogin from './pages/Auth/LoginForm'
import ForgotPassword from './pages/Auth/Forgotpassword'
import CreateSchoolForm from './pages/school/SchoolForm';
import { ContestProvider } from './providers/ContestContext';

const AdminProtectedRoute = () => {
  const token = localStorage.getItem('adminToken');
  if (!token || token === "undefined") {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// Wraps only the routes that need live contest/judge-lock state
const ContestScope = () => (
  <ContestProvider pollInterval={10000}>
    <Outlet />
  </ContestProvider>
);

export default function App() {
  return (
    <Routes>
      {/* ── PUBLIC ROUTES (no polling) ── */}
      <Route path='/' element={<Home />} />
      <Route path='/login' element={<AdminLogin />} />
      <Route path='/forgot-password' element={<ForgotPassword />} />
      <Route path='/school' element={<CreateSchoolForm/>} />

      {/* ── EVERYTHING THAT NEEDS CONTEST STATE ── */}
      <Route element={<ContestScope />}>
        <Route element={<AdminProtectedRoute />}>
          <Route path='/admin' element={<Dashboard />} />
          <Route path='/admin/dashboard' element={<Dashboard />} />
          <Route path='/admin/leaderboard' element={<LeaderBoard />} />
        </Route>

        <Route path='/judge' element={<JudgeTable />} />
        <Route path='/judge/scoreboard' element={<JudgeScoreboard />} />
      </Route>

      {/* ── 404 CATCH-ALL ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}