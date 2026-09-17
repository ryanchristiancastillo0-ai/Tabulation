import { getToken } from '../services/api';
import { refreshAccessToken } from '../services/session';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// POST /api/stream-ui and consume the Server-Sent-Events response so the admin
// terminal can render the LLM code live. Resolves with the final generated HTML
// on success; rejects with a user-readable message on a terminal error event or
// a broken connection. `onDelta` is called for each incoming text chunk.
export async function streamUiUi({ aiPrompt, aiModel, uiMode, contestants, criteria, onDelta, signal: externalSignal }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 min safety cap
  const onExtAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExtAbort);
  }

  const doFetch = () => {
    const token = getToken();
    return fetch(`${API_BASE}/stream-ui`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ aiPrompt, aiModel, uiMode, contestants, criteria }),
      signal: controller.signal,
    });
  };

  try {
    let res = await doFetch();

    // 15-minute access tokens expire while a dashboard stays open — try one
    // silent refresh before treating the stream as a dead session.
    if (res.status === 401) {
      try {
        await refreshAccessToken('admin');
        res = await doFetch();
      } catch {
        // keep res as-is so the 401 branch below signs the user out
      }
    }

    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error('Your session has expired. Please sign in again.');
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let html = null;
    let errorMsg = null;
    let fromCache = false;
    let generationId = null;

    while (html === null && errorMsg === null) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop();

      for (const event of events) {
        for (const line of event.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          let evt;
          try {
            evt = JSON.parse(trimmed.slice(5).trim());
          } catch {
            continue;
          }
          if (evt.type === 'delta' && evt.text) {
            if (onDelta) onDelta(evt.text);
          } else if (evt.type === 'done') {
            html = evt.html || '';
            fromCache = evt.fromCache === true;
            generationId = evt.generationId || null;
          } else if (evt.type === 'error') {
            errorMsg = evt.error || 'AI generation failed.';
          }
        }
      }
    }

    if (errorMsg) throw new Error(errorMsg);
    if (html === null) throw new Error(
      'AI generation was interrupted. Please try again — if it keeps failing, the model may be rate-limited or offline.'
    );
    return { html, fromCache, generationId };
  } finally {
    clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener('abort', onExtAbort);
  }
}