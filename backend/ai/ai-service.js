// ── AI service: routes one request to the selected provider ──────────────────
//   AIService → { provider, model, prompt } → UnoRouterProvider | GeminiProvider
// One request uses exactly ONE provider + ONE selected model — no automatic
// provider switching, no model fallback. The rest of the app receives the same
// plain-text response regardless of which provider was chosen.

const aiModels = require('./ai-models');
const { safeError } = require('./provider-common');
const unorouter = require('./providers/unorouter-provider');
const gemini = require('./providers/gemini-provider');

const PROVIDER_IMPLS = {
  unorouter,
  gemini,
};

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
  return impl.chat({ prompt, model: modelName, onDelta });
}

module.exports = { generate };