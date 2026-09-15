// ── LLM client: B.AI (primary) + OpenRouter (automatic fallback) ──────────────
// Both are OpenAI-compatible chat-completions endpoints. B.AI is always tried
// first with the model selected by the Admin; OpenRouter is an internal failover
// (fixed free model) used only when B.AI cannot complete the request.
// Credentials live ONLY in the backend .env — never the frontend.

const BAI_API_URL = 'https://api.b.ai/v1/chat/completions';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Exactly the three free model IDs offered in the Admin UI (B.AI only).
const SUPPORTED_MODELS = new Set(['qwen3.8-flash', 'mimo-v2.5', 'glm-5.3-flash']);
const DEFAULT_MODEL = process.env.BAI_MODEL || 'qwen3.8-flash';

// OpenRouter fallback is an internal failover — never selectable by the Admin.
const OPENROUTER_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';

// Per-provider timeout. Split the request window in two so a B.AI hang followed
// by an OpenRouter attempt still finishes inside the worker's AI_JOB_TIMEOUT_MS.
const PROVIDER_TIMEOUT_MS = Math.floor(
  (Number(process.env.AI_REQ_TIMEOUT_MS) ||
    Math.max((Number(process.env.AI_JOB_TIMEOUT_MS) || 150000) - 10000, 60000)) / 2
);

function resolveApiKey() {
  const key = process.env.BAI_API_KEY;
  if (!key || !String(key).trim()) {
    throw new Error('AI generation is not configured. Please set BAI_API_KEY in the backend environment.');
  }
  return String(key).trim();
}

function resolveOpenRouterKey() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || !String(key).trim()) {
    throw new Error('Backup AI provider is not configured. Please set OPENROUTER_API_KEY in the backend environment.');
  }
  return String(key).trim();
}

function normalizeModel(model) {
  const modelName = String(model || '').toLowerCase().trim();
  if (modelName && SUPPORTED_MODELS.has(modelName)) return modelName;
  return DEFAULT_MODEL || 'qwen3.8-flash';
}

// User-safe error (no secrets / internals). `safe` lets the worker surface the
// exact message to the admin; `status` marks transient failures for retry.
function safeError(message, status) {
  const err = new Error(message);
  err.safe = true;
  if (status) err.status = status;
  return err;
}

// Only skip the fallback when the request itself was malformed — a bad prompt or
// bad app data would produce the same failure on OpenRouter, so retrying it there
// is pointless. Everything else (auth, rate limit, model/provider unavailable,
// timeouts, network, empty output) triggers the automatic fallback.
function shouldFallback(err) {
  const status = err && err.status;
  if (status === 400 || status === 422) return false;
  return true;
}

// One provider call, provider-specific request built here, normalized response
// (plain text content) returned to the caller. Throws user-safe errors.
async function callChatCompletion({ provider, url, apiKey, model, prompt, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    console.log(`🔵 ${provider} request started (model: ${model})`);
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw safeError('The AI request timed out. Please try again.', 504);
    }
    throw safeError('Could not reach the AI provider. Please try again.', 503);
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const status = response.status;
    const detail = data?.error?.message || `Request failed with status ${status}`;
    console.warn(`⚠️ ${provider} failed (${status}): ${detail}`);

    if (status === 400 || status === 422) {
      throw safeError('The AI request was rejected. Please check the prompt and try again.', status);
    }
    if (status === 401 || status === 403) {
      throw safeError('AI provider rejected the API key. Please ask the administrator to check the backend configuration.');
    }
    if (status === 404) {
      throw safeError('The selected AI model is currently unavailable. Please try again shortly.');
    }
    if (status === 408 || status === 429) {
      throw safeError('The AI provider is busy. Please try again shortly.', status);
    }
    throw safeError('The AI provider is temporarily unavailable. Please try again.', 500);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content || !String(content).trim()) {
    throw safeError('The AI returned an empty response. Please try again.');
  }

  return String(content).trim();
}

// ── Entry point: B.AI first, OpenRouter only when B.AI fails ──────────────────
// Same prompt, same output shape for both — the rest of the system never knows
// which provider produced the result.
async function generateWithFallback(prompt, model) {
    const modelName = normalizeModel(model);

    // 1. B.AI (primary) — Admin-selected model.
    try {
        const content = await callChatCompletion({
            provider: 'B.AI',
            url: BAI_API_URL,
            apiKey: resolveApiKey(),
            model: modelName,
            prompt,
            timeoutMs: PROVIDER_TIMEOUT_MS,
        });
        console.log('✅ B.AI request succeeded');
        return content;
    } catch (err) {
        console.error('❌ B.AI request failed:', err.message);
        if (!shouldFallback(err)) {
            throw (err.safe ? err : safeError('AI generation failed. Please try again.'));
        }
        console.log('🔄 Switching to OpenRouter fallback');
    }

    // 2. OpenRouter (fallback) — fixed free model, invisible to the Admin.
    try {
        const content = await callChatCompletion({
            provider: 'OpenRouter',
            url: OPENROUTER_API_URL,
            apiKey: resolveOpenRouterKey(),
            model: OPENROUTER_MODEL,
            prompt,
            timeoutMs: PROVIDER_TIMEOUT_MS,
        });
        console.log('✅ OpenRouter request succeeded');
        return content;
    } catch (err) {
        console.error('❌ OpenRouter request failed:', err.message);
    }

    // Both providers failed — clean, user-friendly message. The real per-provider
    // errors above are logged on the backend for diagnosis.
    throw safeError('AI generation is temporarily unavailable. Please try again shortly.');
}

module.exports = { generateWithFallback, DEFAULT_MODEL };