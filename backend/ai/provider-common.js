// ── Shared pieces for the AI providers ────────────────────────────────────────
// fetch + timeout + OpenAI-style SSE parsing + user-safe errors. Both providers
// (UnoRouter, Gemini) reuse these so request processing is never duplicated.

const DEFAULT_TIMEOUT_MS = Number(process.env.AI_JOB_TIMEOUT_MS) || 240000;

// User-safe error — the admin terminal shows `err.message` verbatim.
// `status` marks transient failures for retry (429/5xx/timeout).
function safeError(message, status) {
  const err = new Error(message);
  err.safe = true;
  if (status) err.status = status;
  return err;
}

// Per-provider request timeout; a slow model must never block a save forever.
function providerTimeoutMs(providerConfig) {
  const override = Number(process.env[providerConfig.timeoutEnv]);
  if (override && override > 0) return override;
  return DEFAULT_TIMEOUT_MS;
}

// API key lives ONLY in the backend .env — never sent to the frontend.
function getApiKey(providerConfig) {
  const key = process.env[providerConfig.keyEnv];
  if (!key || !String(key).trim()) {
    throw safeError(
      `${providerConfig.label} is not configured. Please set ${providerConfig.keyEnv} in the backend environment.`
    );
  }
  return String(key).trim();
}

// Map provider HTTP errors (OpenAI-compatible + Gemini both carry
// `error.message`) to user-safe messages — never raw internals.
function providerResponseError(status, data) {
  const detail = data?.error?.message || `Request failed with status ${status}`;
  console.warn(`⚠️  AI provider error status=${status} detail="${detail}"`);

  if (status === 400 || status === 422) {
    return safeError('The AI request was rejected. Please check the prompt and try again.', status);
  }
  if (status === 401 || status === 403) {
    return safeError('The AI provider rejected the API key. Please ask the administrator to check the backend configuration.', status);
  }
  if (status === 404) {
    return safeError('The selected AI model is currently unavailable. Please try again shortly.', status);
  }
  if (status === 408 || status === 429) {
    return safeError('The AI provider is busy. Please try again shortly.', status);
  }
  return safeError('The AI provider is temporarily unavailable. Please try again.', status);
}

// One POST to a provider. Non-OK responses are mapped to safe errors.
// Resolves to the parsed JSON body; `stream` resolves to the accumulated text.
async function request({ url, headers, body, timeoutMs, stream = false, getContent, onDelta }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err && err.name === 'AbortError') {
      throw safeError('The AI request timed out. Please try again.', 504);
    }
    console.error(`🌐 AI provider network error:`, err.message);
    throw safeError('Could not reach the AI provider. Please try again.', 503);
  }

  if (!response.ok || !response.body) {
    clearTimeout(timer);
    const data = await response.json().catch(() => null);
    throw providerResponseError(response.status, data);
  }

  if (stream) {
    try {
      return await readSSE(response, getContent, onDelta);
    } finally {
      clearTimeout(timer);
    }
  }

  clearTimeout(timer);
  return await response.json().catch(() => null);
}

// OpenAI-style SSE reader (both providers emit `data:` JSON lines, optionally
// terminated by `data: [DONE]`). Calls `onDelta` per content chunk and returns
// the accumulated text.
async function readSSE(response, getContent, onDelta) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let finished = false;

  while (!finished) {
    let read;
    try {
      read = await reader.read();
    } catch (err) {
      throw safeError('Could not read the AI response. Please try again.', 503);
    }
    if (read.done) break;

    buffer += decoder.decode(read.value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const rawLine of lines) {
      const line = String(rawLine).trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') {
        if (payload === '[DONE]') finished = true;
        continue;
      }
      let parsed;
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue;
      }
      const text = getContent(parsed);
      if (typeof text === 'string' && text.length) {
        fullText += text;
        if (onDelta) {
          try { onDelta(text); } catch { /* handler errors are non-fatal */ }
        }
      }
    }
  }

  if (!String(fullText).trim()) {
    throw safeError('The AI returned an empty response. Please try again.');
  }
  return String(fullText).trim();
}

module.exports = { safeError, request, readSSE, getApiKey, providerTimeoutMs, providerResponseError };