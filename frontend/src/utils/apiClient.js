// utils/apiClient.js
// Thin wrapper around fetch that:
//   1. Automatically attaches Authorization: Bearer <token>
//   2. Always sends/receives JSON
//   3. Throws on non-2xx responses so callers can catch once

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

import { getSchoolId, tokenSchoolId } from './getSchoolId';

// Admin tokens are stored per school (admin_token_<school_id>) so multiple
// school dashboards in different tabs never share/overwrite a single global
// token. Legacy single 'adminToken' is only used when it belongs to the
// school this tab is currently showing.
function getToken() {
  try {
    const sid = String(getSchoolId());
    const scoped = localStorage.getItem(`admin_token_${sid}`);
    if (scoped) return scoped;

    const legacy = localStorage.getItem('adminToken');
    if (legacy && String(tokenSchoolId(legacy)) === sid) return legacy;
    return null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data;
}

// Convenience methods
export const apiClient = {
  get:    (path)       => request(path, { method: 'GET' }),
  post:   (path, body) => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body) => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (path, body) => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: 'DELETE' }),
};

export default apiClient;