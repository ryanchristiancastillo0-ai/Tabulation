import { Route, Navigate, Outlet } from 'react-router-dom';
import Dashboard from '../pages/admin/Dashboard';
import Settings from '../pages/admin/Settings';
import LeaderBoard from '../pages/admin/Leaderboard';
import { AdminProtectedRoute } from './ProtectedRoute';
import { ThemeProvider } from '../context/ThemeContext';
import { ContestProvider } from '../context/ContestContext';

export const ContestScope = () => (
  <ContestProvider pollInterval={10000}>
    <Outlet />
  </ContestProvider>
);

export const ThemeScope = () => (
  <ThemeProvider>
    <Outlet />
  </ThemeProvider>
);

export default function AdminRoutes() {
  return (
    <Route element={<AdminProtectedRoute />}>
      <Route element={<ThemeScope />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/leaderboard" element={<LeaderBoard />} />
      </Route>
    </Route>
  );
}