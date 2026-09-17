// Presence heartbeat hook. While the user is actively using the page (or was
// recently), it POSTs /auth/presence with the refresh token on a throttled
// cadence so the backend keeps `last_seen` fresh. When the user goes idle, the
// heartbeats stop — after 24 hours of no heartbeat the backend considers the
// session (and therefore the school) offline and the user is signed out.
//
// This is what makes "online" accurate when someone just closes the browser,
// tab, or device without pressing Log Out.

import { useEffect, useRef } from 'react';
import { getSchoolId } from '../utils/getSchoolId';
import {
  getAdminRefreshToken,
  getJudgeRefreshToken,
  redirectToLogin,
} from '../services/session';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const HEARTBEAT_CADENCE_MS  = 60 * 1000;    // re-check every minute
const HEARTBEAT_THROTTLE_MS = 30 * 1000;    // min gap between actual POSTs
const IDLE_WINDOW_MS        = 10 * 60 * 1000; // no interaction → stop heartbeats

export function usePresence(role = 'admin') {
  const lastActivity = useRef(0);
  const lastSent     = useRef(0);
  const hasSent      = useRef(false);

  useEffect(() => {
    lastActivity.current = Date.now();
    const sid     = getSchoolId();
    const refresh = role === 'judge' ? getJudgeRefreshToken() : getAdminRefreshToken();
    if (!sid || !refresh) return; // no session on this tab — nothing to announce

    let cancelled = false;

    const send = async () => {
      if (cancelled) return;
      const now = Date.now();

      if (now - lastSent.current < HEARTBEAT_THROTTLE_MS) return;

      // Already announced this session once and the user has been inactive for
      // a while → go silent so "online" can genuinely expire when idle. (A tab
      // left open forever must not keep a school online.)
      if (hasSent.current && now - lastActivity.current > IDLE_WINDOW_MS) return;

      const current = role === 'judge' ? getJudgeRefreshToken() : getAdminRefreshToken();
      if (!current) return;

      lastSent.current = now;
      hasSent.current  = true;

      try {
        const res = await fetch(`${API_BASE}/auth/presence`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ refresh_token: current }),
        });
        if (res.ok) return;
        if (res.status === 401 || res.status === 403) redirectToLogin(role);
      } catch {
        /* offline — will retry on the next tick */
      }
    };

    const onActivity = () => { lastActivity.current = Date.now(); };
    const onVisible  = () => {
      if (document.visibilityState === 'visible') {
        lastActivity.current = Date.now();
        send();
      }
    };

    window.addEventListener('pointerdown', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('touchstart', onActivity);
    document.addEventListener('visibilitychange', onVisible, true);

    send(); // announce presence immediately on mount

    const interval = setInterval(send, HEARTBEAT_CADENCE_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('touchstart', onActivity);
      document.removeEventListener('visibilitychange', onVisible, true);
    };
  }, [role]);
}

export default usePresence;