import { Navigate, Outlet } from 'react-router-dom';
import { getSchoolId, tokenSchoolId, isTokenExpired } from '../utils/getSchoolId';
import { getValidJudgeSchool, getJudgePageUrl } from '../utils/judge';

/**
 * Guards admin routes. Requires a valid admin JWT that belongs to the active
 * school. Otherwise redirects to /login with the expired flag.
 */
export const AdminProtectedRoute = () => {
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

/**
 * Guards judge routes. The judge's REAL school always comes from the valid
 * token/session — the URL is never trusted. If the URL was tampered with
 * (?school_id=2, ?sc=…) to point at another school, we bounce the judge to
 * their OWN school page.
 */
export const JudgeProtectedRoute = () => {
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

/**
 * Legacy guard kept for compatibility. Prefer AdminProtectedRoute.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;