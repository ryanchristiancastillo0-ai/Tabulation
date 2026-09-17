// ── AI service: routes one request to the selected provider ──────────────────
//   AIService → { provider, model, prompt } → GroqProvider | GeminiProvider | OpenRouterProvider
// The selected provider + model is tried first. On transient failures (rate
// limit, quota exceeded, temporary outage, model unavailable, timeout) the
// request falls back through the provider chain (Gemini → Groq → OpenRouter)
// using each provider's configured model. Each provider is attempted at most
// once per generate() call, so a broken key or outage can never loop forever.
// Bad-request and API-key errors are NOT fallback-eligible — they surface so
// the admin can fix the configuration. Provider-specific API logic stays inside
// the provider modules; the rest of the app receives the same plain-text
// response regardless of which provider generated it.

const aiModels = require('./ai-models');
const { safeError } = require('./provider-common');
const groq = require('./providers/groq-provider');
const gemini = require('./providers/gemini-provider');
const openrouter = require('./providers/openrouter-provider');

const PROVIDER_IMPLS = {
  groq,
  gemini,
  openrouter,
};

// Fallback order for transient failures (preferred: Gemini → Groq → OpenRouter).
const FALLBACK_ORDER = ['gemini', 'groq', 'openrouter'];

// Statuses that mean "the provider itself failed" → safe to move on.
// 400/422 (invalid request) and 401/403 (bad API key) are NOT included: they
// are configuration problems another provider cannot fix, so they must surface.
const FALLBACK_HTTP = new Set([404, 408, 429, 500, 502, 503, 504]);

// Transient/unavailable failures are fallback-eligible; everything else (bad
// request, bad key, missing key) must surface to the admin.
function isTransientFailure(err) {
  if (!err) return false;
  if (err.status && FALLBACK_HTTP.has(err.status)) return true;
  const msg = String(err.message || '');
  return /timed out|timeout|etimedout|econnreset|econnrefused|could not reach|network|rate.?limit|quota|temporar|unavailable|busy/i.test(msg);
}

// A provider without its API key configured cannot be used as a fallback.
function isConfigured(providerName) {
  const cfg = providerName && aiModels.PROVIDERS[providerName];
  return !!cfg && !!String(process.env[cfg.keyEnv] || '').trim();
}

// Try the selected provider, then each configured provider in FALLBACK_ORDER.
// Returns the first successful text; throws the last transient error when every
// eligible provider failed (non-transient errors throw immediately).
async function chatWithFallback({ providerName, model, prompt, onDelta }) {
  let lastErr;
  try {
    return await PROVIDER_IMPLS[providerName].chat({ prompt, model, onDelta });
  } catch (err) {
    lastErr = err;
    console.warn(`🔁 [ai-service] ${providerName} failed status=${err.status ?? 'no-status'} "${err.message}"`);
    if (!isTransientFailure(err)) throw err;
  }

  for (const alt of FALLBACK_ORDER) {
    if (alt === providerName) continue;
    if (!PROVIDER_IMPLS[alt] || !isConfigured(alt)) continue;
    const altModel = aiModels.listModels(alt)[0];
    console.log(`🔁 [ai-service] falling back provider=${alt} model=${altModel}`);
    try {
      return await PROVIDER_IMPLS[alt].chat({ prompt, model: altModel, onDelta });
    } catch (err) {
      console.warn(`🔁 [ai-service] fallback ${alt} failed status=${err.status ?? 'no-status'} "${err.message}"`);
      lastErr = err;
      if (!isTransientFailure(err)) throw err;
    }
  }

  throw lastErr;
}

// Single entry point. `onDelta` (optional) turns the request into a live SSE
// stream; without it the provider returns the full text at once.
async function generate({ provider, model, prompt, onDelta }) {
  let providerName;
  let modelName;
  try {
    ({ provider: providerName, model: modelName } = aiModels.assertValidProviderModel(provider, model));
  } catch (err) {
    // Keep the validation message user-safe for the streaming terminal.
    const e = safeError(err.message, err.status);
    throw e;
  }

  const impl = PROVIDER_IMPLS[providerName];
  if (!impl) throw safeError(`Unknown AI provider "${providerName}".`);

  console.log(`🤖 [ai-service] provider=${providerName} model=${modelName} stream=${typeof onDelta === 'function'}`);
  return chatWithFallback({ providerName, model: modelName, prompt, onDelta });
}

module.exports = { generate };