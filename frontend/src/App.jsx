import { Route, Routes, Navigate, Outlet } from 'react-router-dom'
import './index.css'
import Home from './components/home'
import JudgeTable from './pages/judge/JudgeTable'
import Dashboard from './pages/admin/Dashboard'
import JudgeScoreboard from './pages/judge/JudgeScoreboard'
import LeaderBoard from './components/admin/Leaderboard'
import AdminLogin from './components/admin/LoginForm'
import ForgotPassword from './components/admin/Forgotpassword'
import CreateSchoolForm from './pages/school/SchoolForm';
import { ContestProvider } from './providers/ContestContext';

/**
 * ── ADMIN PROTECTION GUARD ──
 * This acts as the "Bouncer." If no token is found, 
 * it kicks the user back to the login page.
 */
const AdminProtectedRoute = () => {
  const token = localStorage.getItem('adminToken');
  
  // Strict check: if token is null, undefined, or empty string
  if (!token || token === "undefined") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default function App() {
  return (
 <ContestProvider pollInterval={4000}>
     <Routes>
      {/* ── PUBLIC ROUTES ── */}
      <Route path='/' element={<Home />} />
      <Route path='/login' element={<AdminLogin />} />
      <Route path='/forgot-password' element={<ForgotPassword />} />
      
      {/* ── PROTECTED ADMIN ROUTES ── */}
      {/* Everything inside this group requires 'adminToken' */}
      <Route element={<AdminProtectedRoute />}>
        {/* We use /admin as the main entry point */}
        <Route path='/admin' element={<Dashboard />} />
        {/* Added /admin/dashboard to match your LoginForm's navigate() */}
        <Route path='/admin/dashboard' element={<Dashboard />} />
        <Route path='/admin/leaderboard' element={<LeaderBoard />} />
      </Route>

      {/* ── JUDGE ROUTES ── */}
      <Route path='/judge' element={<JudgeTable />} />
      <Route path='/judge/scoreboard' element={<JudgeScoreboard />} />
      
      {/* School  */}
       <Route path='/school' element={<CreateSchoolForm/>} />

      {/* ── 404 CATCH-ALL ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
 </ContestProvider>
  );
}