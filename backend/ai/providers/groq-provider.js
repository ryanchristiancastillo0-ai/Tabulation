// ── Groq provider ─────────────────────────────────────────────────────────────
// OpenAI-compatible chat-completions via https://api.groq.com/openai/v1.
// Admin-selected model, one provider, one model, no automatic switching.

const aiModels = require('../ai-models');
const { safeError, request, getApiKey, providerTimeoutMs } = require('../provider-common');

const CONFIG = aiModels.PROVIDERS.groq;
const BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

// One request — streaming or one-shot — to Groq. Returns the text.
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
      console.log(`✅ [Groq] stream success model=${model} ${Date.now() - t0}ms`);
      return text;
    }

    const data = await request({ url: BASE_URL, headers, body, timeoutMs: resolvedTimeout });
    const content = data?.choices?.[0]?.message?.content;
    if (!content || !String(content).trim()) {
      throw safeError('The AI returned an empty response. Please try again.');
    }
    const text = String(content).trim();
    console.log(`✅ [Groq] success model=${model} ${Date.now() - t0}ms`);
    return text;
  } catch (err) {
    console.error(`❌ [Groq] failed model=${model} ${Date.now() - t0}ms:`, err.message);
    throw err;
  }
}

module.exports = { chat };