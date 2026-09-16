// ── AI provider/model configuration — ONE source of truth ────────────────────
// Exactly TWO providers: UnoRouter + Google Gemini. The backend is authoritative:
// every provider/model combination is validated here before any request is made,
// and the Admin UI receives only the safe metadata below (provider name + model
// ids) — never any credentials. Do not add providers or invent model ids.

const HttpError = require('../utils/http-error');

const PROVIDERS = {
  unorouter: {
    name: 'unorouter',
    label: 'UnoRouter',
    keyEnv: 'UNOROUTER_API_KEY',
    timeoutEnv: 'UNOROUTER_TIMEOUT_MS',
    models: [
      'codestral-latest',
      'qwen3.8-flash',
      'glm-5.3-flash',
      'gemini-3.5-flash-lite',
      'gpt-oss-20b',
    ],
  },
  gemini: {
    name: 'gemini',
    label: 'Google Gemini',
    keyEnv: 'GEMINI_API_KEY',
    timeoutEnv: 'GEMINI_TIMEOUT_MS',
    models: ['gemini-3.1-flash-lite'],
  },
};

const DEFAULT_PROVIDER = 'unorouter';
const DEFAULT_MODEL = 'codestral-latest';
const PROVIDER_NAMES = Object.keys(PROVIDERS);

function getProvider(provider) {
  return PROVIDERS[String(provider || '').toLowerCase().trim()] || null;
}

function providerLabel(provider) {
  const p = getProvider(provider);
  return p ? p.label : '';
}

function listModels(provider) {
  const p = getProvider(provider);
  return p ? [...p.models] : [];
}

function hasModel(provider, model) {
  const p = getProvider(provider);
  return !!(p && p.models.includes(String(model || '').toLowerCase().trim()));
}

// Strict backend validation — throws HttpError(400) for unknown providers,
// unknown models, and invalid provider/model combinations. Used by
// save-config and the legacy /ai/generate path; the UI can never bypass it.
function assertValidProviderModel(provider, model) {
  const p = getProvider(provider);
  if (!p) throw new HttpError(400, `Unknown AI provider "${provider}".`);
  const m = String(model || '').toLowerCase().trim();
  if (!p.models.includes(m)) {
    const alternatives = p.models.map((x) => `"${x}"`).join(', ');
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
    models: [...PROVIDERS[name].models],
  }));
}

module.exports = {
  PROVIDERS,
  PROVIDER_NAMES,
  DEFAULT_PROVIDER,
  DEFAULT_MODEL,
  getProvider,
  providerLabel,
  listModels,
  hasModel,
  assertValidProviderModel,
  safeModelMetadata,
};