import { Route, Routes, Navigate, Outlet } from 'react-router-dom'
import './index.css'
import Home from './pages/Home/home'
import JudgeTable from './pages/judge/JudgeTable'
import Dashboard from './pages/admin/Dashboard'
import SettingsPage from './pages/admin/SettingsPage'
import JudgeScoreboard from './pages/judge/JudgeScoreboard'
import LeaderBoard from './pages/Leaderboard/Leaderboard'
import AdminLogin from './pages/Auth/LoginForm'
import ForgotPassword from './pages/Auth/Forgotpassword'
import CreateSchoolForm from './pages/school/SchoolForm';
import JudgeLoginPage from './pages/judge/JudgeLoginPage';
import { ContestProvider } from './providers/ContestContext';
import { ThemeProvider } from './providers/ThemeProvider';
import { ConfigChangeProvider } from './providers/ConfigChangeContext';
import { getSchoolId, tokenSchoolId, isTokenExpired } from './utils/getSchoolId';
import { getValidJudgeSchool, getJudgePageUrl } from './utils/judge';

const AdminProtectedRoute = () => {
  const sid = getSchoolId();
  const token = localStorage.getItem(`admin_token_${sid}`) ||
                localStorage.getItem('adminToken');
  if (!token || token === "undefined" || isTokenExpired(token)) {
    return <Navigate to="/login?expired=1" replace />;
  }
  // Also verify the token really belongs to the school this tab shows.
  if (String(tokenSchoolId(token)) !== String(sid)) {
    return <Navigate to="/login?expired=1" replace />;
  }
  return <Outlet />;
};

const JudgeProtectedRoute = () => {
  // The judge's REAL school always comes from the valid token/session — the
  // URL is never trusted. If the URL was tampered with (?school_id=2, ?sc=…)
  // to point at another school, we bounce the judge to their OWN school page.
  const activeSid = getValidJudgeSchool();
  if (!activeSid) {
    return <Navigate to="/judge/login" replace />;
  }

  const ownHref = getJudgePageUrl(window.location.pathname, activeSid);
  const currentHref = window.location.pathname + window.location.search;

  // Canonicalize whatever the user typed into their own canonical judge URL
  // (handles no-param, stale ?school_id=, and foreign-school attempts alike).
  if (currentHref !== ownHref) {
    return <Navigate to={ownHref} replace />;
  }
  return <Outlet />;
};

// Wraps only the routes that need live contest/judge-lock state
const ContestScope = () => (
  <ContestProvider pollInterval={10000}>
    <Outlet />
  </ContestProvider>
);

// Applies the shared admin dark/light theme (Dashboard, Leaderboard, etc.)
const ThemeScope = () => (
  <ThemeProvider>
    <Outlet />
  </ThemeProvider>
);

export default function App() {
  return (
    <ConfigChangeProvider>
      <Routes>
        {/* ── PUBLIC ROUTES (no polling) ── */}
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<AdminLogin />} />
        <Route path='/judge/login' element={<JudgeLoginPage />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/school' element={<CreateSchoolForm/>} />

        {/* ── EVERYTHING THAT NEEDS CONTEST STATE ── */}
        <Route element={<ContestScope />}>
          <Route element={<AdminProtectedRoute />}>
            <Route element={<ThemeScope />}>
              <Route path='/admin' element={<Dashboard />} />
              <Route path='/admin/dashboard' element={<Dashboard />} />
              <Route path='/admin/settings' element={<SettingsPage />} />
              <Route path='/admin/leaderboard' element={<LeaderBoard />} />
            </Route>
          </Route>

          <Route element={<JudgeProtectedRoute />}>
            <Route path='/judge' element={<JudgeTable />} />
            <Route path='/judge/scoreboard' element={<JudgeScoreboard />} />
          </Route>
        </Route>

        {/* ── 404 CATCH-ALL ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfigChangeProvider>
  );
}