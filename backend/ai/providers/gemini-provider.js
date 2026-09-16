// ── Google Gemini provider ────────────────────────────────────────────────────
// Official REST API: https://generativelanguage.googleapis.com/v1beta
// One provider, one model, no automatic switching. Streams via SSE
// (streamGenerateContent?alt=sse) to keep the admin terminal live.

const aiModels = require('../ai-models');
const { safeError, request, getApiKey, providerTimeoutMs } = require('../provider-common');

const CONFIG = aiModels.PROVIDERS.gemini;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Gemini streaming chunks carry the same shape as non-streaming:
// `candidates[0].content.parts[0].text`. Some versions emit `part`
// (singular) — handle both.
function getText(chunk) {
  const part = chunk?.candidates?.[0]?.content;
  if (!part) return undefined;
  return part.parts?.[0]?.text ?? part.part?.[0]?.text;
}

async function chat({ prompt, model, onDelta, timeoutMs }) {
  const apiKey = getApiKey(CONFIG);
  const resolvedTimeout = timeoutMs || providerTimeoutMs(CONFIG);
  const isStream = typeof onDelta === 'function';
  const url = isStream
    ? `${BASE_URL}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`
    : `${BASE_URL}/${model}:generateContent?key=${apiKey}`;
  const body = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  const t0 = Date.now();
  const headers = { 'Content-Type': 'application/json' };

  try {
    if (isStream) {
      const text = await request({
        url,
        headers,
        body,
        timeoutMs: resolvedTimeout,
        stream: true,
        getContent: getText,
        onDelta,
      });
      console.log(`✅ [Gemini] stream success model=${model} ${Date.now() - t0}ms`);
      return text;
    }

    const data = await request({ url, headers, body, timeoutMs: resolvedTimeout });
    const content = data?.candidates?.[0]?.content;
    const text = content?.parts?.[0]?.text ?? content?.part?.[0]?.text;
    if (!text || !String(text).trim()) {
      throw safeError('The AI returned an empty response. Please try again.');
    }
    console.log(`✅ [Gemini] success model=${model} ${Date.now() - t0}ms`);
    return String(text).trim();
  } catch (err) {
    console.error(`❌ [Gemini] failed model=${model} ${Date.now() - t0}ms:`, err.message);
    throw err;
  }
}

module.exports = { chat };