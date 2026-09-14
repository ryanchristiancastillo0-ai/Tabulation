import { Route, Routes, Navigate } from 'react-router-dom';
import Home from '../pages/public/Home';
import AdminLogin from '../pages/auth/Login';
import JudgeLogin from '../pages/auth/JudgeLogin';
import ForgotPassword from '../pages/auth/ForgotPassword';
import CreateSchoolForm from '../pages/public/SchoolRegistration';
import AdminRoutes, { ContestScope } from './AdminRoutes';
import JudgeRoutes from './JudgeRoutes';

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── PUBLIC ROUTES (no polling) ── */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/judge/login" element={<JudgeLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/school" element={<CreateSchoolForm />} />

      {/* ── EVERYTHING THAT NEEDS CONTEST STATE ── */}
      <Route element={<ContestScope />}>
        {AdminRoutes()}
        {JudgeRoutes()}
      </Route>

      {/* ── 404 CATCH-ALL ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}