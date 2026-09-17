import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getSchoolId, tokenSchoolId, isTokenExpired, setActiveSchoolId } from '../utils/getSchoolId';
import { getJudgePageUrl } from '../utils/judge';
import { refreshAccessToken, redirectToLogin, judgeRefreshKey } from '../services/session';
import { USALoader } from '../components/ui';

// Full-screen pause shown only while an expired access token is being silently
// refreshed. Brief, so the existing login redirect still feels instant.
function SessionGateLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFCF9]">
      <USALoader prompt="Resuming session…" />
    </div>
  );
}

// ── Judge session detection ────────────────────────────────────────────────
// A judge stays signed in across 15-minute access-token windows thanks to the
// 7-day refresh token, so the guard must look at refresh tokens too — not just
// the (possibly expired) access token. This finds the school that owns this
// tab's judge session; the URL is never trusted.
function candidateJudgeSchoolId() {
  try {
    const hasJudgeSession = (sid) => {
      const s = String(sid);
      return (
        !!localStorage.getItem(`judge_token_${s}`) ||
        !!localStorage.getItem(judgeRefreshKey(s)) ||
        (() => {
          const legacy = localStorage.getItem('judgeToken');
          return !!legacy && String(tokenSchoolId(legacy)) === s;
        })()
      );
    };

    const session = sessionStorage.getItem('active_school_id');
    if (session && hasJudgeSession(session)) return session;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const match = key && key.match(/^judge_token_(\d+)$/);
      if (match && hasJudgeSession(match[1])) return match[1];
      if (key && key.startsWith('judge_refresh_') && matchRefreshKey(key)) {
        const sid = key.split('judge_refresh_')[1];
        if (sid && hasJudgeSession(sid)) return sid;
      }
    }

    const legacy = localStorage.getItem('judgeToken');
    if (legacy) return String(tokenSchoolId(legacy));

    try {
      const auth = JSON.parse(localStorage.getItem('auth') || 'null');
      if (auth?.role === 'judge' && auth.school?.id) return String(auth.school.id);
    } catch { /* ignore */ }
    return null;
  } catch {
    return null;
  }
}

function matchRefreshKey(key) {
  return /^judge_refresh_\d+$/.test(key);
}

/**
 * Guards admin routes. Requires a valid admin session for the active school.
 * A missing/expired access token is NOT an instant redirect — one silent
 * refresh is attempted first (a 15m access token can expire while the tab is
 * open). Only when that fails does the user land on /login.
 */
export const AdminProtectedRoute = () => {
  const sid = getSchoolId();
  const token = localStorage.getItem(`admin_token_${sid}`) ||
                localStorage.getItem('adminToken');
  const usable = !!sid &&
    !!token && token !== "undefined" &&
    !isTokenExpired(token) &&
    String(tokenSchoolId(token)) === String(sid);

  const [checking, setChecking] = useState(!usable);

  useEffect(() => {
    if (usable) return;
    let cancelled = false;
    (async () => {
      try {
        await refreshAccessToken('admin');
        if (!cancelled) setChecking(false);
      } catch {
        if (!cancelled) redirectToLogin('admin');
      }
    })();
    return () => { cancelled = true; };
  }, [usable, sid]);

  if (checking) return <SessionGateLoader />;
  return <Outlet />;
};

/**
 * Guards judge routes. The judge's REAL school always comes from the stored
 * session/refresh token — the URL is never trusted. If the URL was tampered
 * with (?school_id=2, ?sc=…) to point at another school, we bounce the judge
 * to their OWN school page. Expired access tokens are silently refreshed once
 * before bouncing to the login page.
 */
export const JudgeProtectedRoute = () => {
  const candidate = candidateJudgeSchoolId();

  const token = candidate
    ? localStorage.getItem(`judge_token_${candidate}`) || localStorage.getItem('judgeToken')
    : null;
  const usable = !!candidate &&
    !!token && token !== "undefined" &&
    !isTokenExpired(token) &&
    String(tokenSchoolId(token)) === String(candidate);

  const [checking, setChecking] = useState(!usable && !!candidate);

  useEffect(() => {
    if (usable || !candidate) return;
    // Anchor the refresh to the judge's own school before any token write.
    setActiveSchoolId(candidate);
    let cancelled = false;
    (async () => {
      try {
        await refreshAccessToken('judge');
        if (!cancelled) setChecking(false);
      } catch {
        if (!cancelled) redirectToLogin('judge');
      }
    })();
    return () => { cancelled = true; };
  }, [usable, candidate]);

  if (!candidate) {
    return <Navigate to="/judge/login" replace />;
  }

  if (checking) return <SessionGateLoader />;

  const ownHref = getJudgePageUrl(window.location.pathname, candidate);
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