// ── OpenRouter provider ──────────────────────────────────────────────────────
// OpenAI-compatible chat-completions via https://openrouter.ai/api/v1.
// The model id is centralized in ai-models.js (currently the free router
// 'openrouter/free' — picks among OpenRouter's currently-free models).
// Admin-selected model, one provider, one model, no automatic switching.

const aiModels = require('../ai-models');
const { safeError, request, getApiKey, providerTimeoutMs } = require('../provider-common');

const CONFIG = aiModels.PROVIDERS.openrouter;
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

// One request — streaming or one-shot — to OpenRouter. Returns the text.
async function chat({ prompt, model, onDelta, timeoutMs }) {
  const apiKey = getApiKey(CONFIG);
  const resolvedTimeout = timeoutMs || providerTimeoutMs(CONFIG);
  const isStream = typeof onDelta === 'function';
  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    ...(isStream ? { stream: true } : {}),
  };
  const t0 = Date.now();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  try {
    if (isStream) {
      const text = await request({
        url: BASE_URL,
        headers,
        body,
        timeoutMs: resolvedTimeout,
        stream: true,
        getContent: (j) => j?.choices?.[0]?.delta?.content,
        onDelta,
      });
      console.log(`✅ [OpenRouter] stream success model=${model} ${Date.now() - t0}ms`);
      return text;
    }

    const data = await request({ url: BASE_URL, headers, body, timeoutMs: resolvedTimeout });
    const content = data?.choices?.[0]?.message?.content;
    if (!content || !String(content).trim()) {
      throw safeError('The AI returned an empty response. Please try again.');
    }
    const text = String(content).trim();
    console.log(`✅ [OpenRouter] success model=${model} ${Date.now() - t0}ms`);
    return text;
  } catch (err) {
    console.error(`❌ [OpenRouter] failed model=${model} ${Date.now() - t0}ms:`, err.message);
    throw err;
  }
}

module.exports = { chat };