// ── AI provider/model configuration — ONE source of truth ────────────────────
// Providers: Groq + Google Gemini + OpenRouter. The backend is authoritative:
// every provider/model combination is validated here before any request is made,
// and the Admin UI receives only the safe metadata below (provider name + model
// ids) — never any credentials. Do not add providers or invent model ids.

const HttpError = require('../utils/http-error');

const PROVIDERS = {
  groq: {
    name: 'groq',
    label: 'Groq',
    keyEnv: 'GROQ_API_KEY',
    timeoutEnv: 'GROQ_TIMEOUT_MS',
    modelEnv: 'GROQ_MODEL',
    models: [
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.6-27b',
    ],
  },
  gemini: {
    name: 'gemini',
    label: 'Google Gemini',
    keyEnv: 'GEMINI_API_KEY',
    timeoutEnv: 'GEMINI_TIMEOUT_MS',
    modelEnv: 'GEMINI_MODEL',
    models: ['gemini-3.1-flash-lite'],
  },
  openrouter: {
    name: 'openrouter',
    label: 'OpenRouter',
    keyEnv: 'OPENROUTER_API_KEY',
    timeoutEnv: 'OPENROUTER_TIMEOUT_MS',
    modelEnv: 'OPENROUTER_MODEL',
    // The FREE router — picks among OpenRouter's currently-free models. Change
    // this id here (single location) if the free model situation ever changes.
    models: ['openrouter/free'],
  },
};

const DEFAULT_PROVIDER = 'groq';
const PROVIDER_NAMES = Object.keys(PROVIDERS);

// Legacy pre-Groq values that may still be stored in DB rows from before the
// rename. Read paths coalesce them so existing saved settings keep working:
//   provider 'unorouter'  → 'groq'
//   model    'codestral-latest' → DEFAULT_MODEL
function coalesceProvider(provider) {
  const p = String(provider || '').toLowerCase().trim();
  return p === 'unorouter' ? 'groq' : p;
}

function coalesceModel(model) {
  const m = String(model || '').toLowerCase().trim();
  return m === 'codestral-latest' ? DEFAULT_MODEL : m;
}

function getProvider(provider) {
  return PROVIDERS[String(provider || '').toLowerCase().trim()] || null;
}

function providerLabel(provider) {
  const p = getProvider(provider);
  return p ? p.label : '';
}

// Resolved model list for a provider. The environment override
// (GROQ_MODEL / GEMINI_MODEL / OPENROUTER_MODEL) — when set — becomes the
// preferred/first model, so the model is configurable on Render without any
// code change. The static list in PROVIDERS stays the validated fallback set.
function listModels(provider) {
  const p = getProvider(provider);
  if (!p) return [];
  const envModel = String(process.env[p.modelEnv] || '').trim();
  if (envModel && !p.models.includes(envModel)) return [envModel, ...p.models];
  return [...p.models];
}

// The default model for a provider: its env override if set, else the first
// static model. This is the single "current" model used when settings are empty.
function defaultModelFor(provider) {
  return listModels(provider)[0] || '';
}

const DEFAULT_MODEL = defaultModelFor(DEFAULT_PROVIDER);

function hasModel(provider, model) {
  return listModels(provider).includes(String(model || '').toLowerCase().trim());
}

// Strict backend validation — throws HttpError(400) for unknown providers,
// unknown models, and invalid provider/model combinations. Used by
// save-config and the legacy /ai/generate path; the UI can never bypass it.
function assertValidProviderModel(provider, model) {
  const p = getProvider(provider);
  if (!p) throw new HttpError(400, `Unknown AI provider "${provider}".`);
  const m = String(model || '').toLowerCase().trim();
  if (!listModels(provider).includes(m)) {
    const alternatives = listModels(provider).map((x) => `"${x}"`).join(', ');
    throw new HttpError(
      400,
      `"${model}" is not a valid model for ${p.label}. Valid models: ${alternatives}.`
    );
  }
  return { provider: p.name, model: m };
}

// Safe metadata for the Admin UI — provider names + model ids only.
function safeModelMetadata() {
  return PROVIDER_NAMES.map((name) => ({
    provider: PROVIDERS[name].name,
    label: PROVIDERS[name].label,
    models: listModels(name),
  }));
}

module.exports = {
  PROVIDERS,
  PROVIDER_NAMES,
  DEFAULT_PROVIDER,
  DEFAULT_MODEL,
  coalesceProvider,
  coalesceModel,
  getProvider,
  providerLabel,
  listModels,
  defaultModelFor,
  hasModel,
  assertValidProviderModel,
  safeModelMetadata,
};