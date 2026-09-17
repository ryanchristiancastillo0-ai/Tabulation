// Smoke tests for the three-provider AI system (no external calls, no keys required).
// Covers provider/model validation, provider adapters, and the fallback chain.
// Run with: npm test
const assert = require('assert');

const aiModels = require('../ai/ai-models');
const pc = require('../ai/provider-common');
const aiService = require('../ai/ai-service');

let passed = 0;
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ✓ ${name}`);
    })
    .catch((err) => {
      console.error(`  ✗ ${name}\n    ${err && err.stack}`);
      process.exitCode = 1;
    });
}

async function main() {
  await test('ai-models: defaults + safe metadata (no key env leaked)', () => {
    assert.strictEqual(aiModels.DEFAULT_PROVIDER, 'groq');
    assert.strictEqual(aiModels.DEFAULT_MODEL, 'openai/gpt-oss-120b');
    const meta = JSON.stringify(aiModels.safeModelMetadata());
    assert.ok(!meta.includes('API_KEY'), 'metadata must never leak key env names');
    assert.ok(meta.includes('Groq'));
    assert.ok(meta.includes('gemini-3.1-flash-lite'));
    assert.ok(meta.includes('OpenRouter'));
    assert.ok(meta.includes('openrouter/free'));
  });

  await test('ai-models: valid provider/model pairs accepted', () => {
    assert.deepStrictEqual(aiModels.assertValidProviderModel('groq', 'openai/gpt-oss-120b'), { provider: 'groq', model: 'openai/gpt-oss-120b' });
    assert.deepStrictEqual(aiModels.assertValidProviderModel('GEMINI', 'Gemini-3.1-Flash-Lite'), { provider: 'gemini', model: 'gemini-3.1-flash-lite' });
    assert.deepStrictEqual(aiModels.assertValidProviderModel('openrouter', 'openrouter/free'), { provider: 'openrouter', model: 'openrouter/free' });
  });

  await test('ai-models: wrong-provider model / legacy B.AI / unknown all rejected', () => {
    assert.throws(() => aiModels.assertValidProviderModel('groq', 'gemini-3.1-flash-lite'), /not a valid model/);
    assert.throws(() => aiModels.assertValidProviderModel('openrouter', 'gpt-4o'), /not a valid model/);
    assert.throws(() => aiModels.assertValidProviderModel('openrouter', 'codestral-latest'), /not a valid model/);
    assert.throws(() => aiModels.assertValidProviderModel('bai', 'anything'), /Unknown AI provider/);
    assert.throws(() => aiModels.assertValidProviderModel('gemini', 'codestral-latest'), /not a valid model/);
    assert.throws(() => aiModels.assertValidProviderModel('', 'codestral-latest'), /Unknown AI provider/);
  });

  await test('provider-common: missing key -> safe, user-readable', () => {
    const keyEnv = aiModels.PROVIDERS.groq.keyEnv;
    const prev = process.env[keyEnv];
    delete process.env[keyEnv];
    try {
      assert.throws(() => pc.getApiKey(aiModels.PROVIDERS.groq), (e) => {
        assert.strictEqual(e.safe, true);
        assert.ok(e.message.includes(keyEnv), `message mentions ${keyEnv}`);
        return true;
      });
    } finally {
      if (prev !== undefined) process.env[keyEnv] = prev;
    }
  });

  await test('provider-common: HTTP error mapping is user-safe', () => {
    const e401 = pc.providerResponseError(401, { error: { message: 'the real key problem' } });
    assert.strictEqual(e401.safe, true);
    assert.ok(!e401.message.includes('the real key problem'), 'never leak raw internals');
    assert.strictEqual(pc.providerResponseError(429, {}).status, 429);
    assert.ok(pc.providerResponseError(408, {}).message.includes('busy'));
    assert.ok(pc.providerResponseError(404, {}).message.includes('model'));
  });

  await test('provider-common: one-shot request maps non-OK response + JSON', async () => {
    const realFetch = global.fetch;
    global.fetch = async () => ({
      ok: true, status: 200, body: {}, json: async () => ({ choices: [{ message: { content: 'TABLE' } }] }),
    });
    try {
      const data = await pc.request({ url: 'x', headers: {}, body: {} });
      assert.strictEqual(data.choices[0].message.content, 'TABLE');
    } finally { global.fetch = realFetch; }

    global.fetch = realFetch;
    global.fetch = async () => ({ ok: false, status: 429, json: async () => ({}) });
    try {
      await assert.rejects(() => pc.request({ url: 'x', headers: {}, body: {} }), /busy/);
    } finally { global.fetch = realFetch; }
  });

  await test('provider-common: SSE reader accumulates deltas and stops at [DONE]', async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"lo!"}}]}\n\n',
      'data: [DONE]\n\n',
    ];
    const realFetch = global.fetch;
    global.fetch = async () => ({ ok: true, status: 200, body: { getReader: () => makeReader(chunks) } });
    let joined = '';
    try {
      const text = await pc.request({
        url: 'groq', headers: {}, body: {}, stream: true,
        getContent: (j) => j?.choices?.[0]?.delta?.content,
        onDelta: (d) => { joined += d; },
      });
      assert.strictEqual(text, 'Hello!');
      assert.strictEqual(joined, 'Hello!');
    } finally { global.fetch = realFetch; }
  });

  await test('provider-common: empty SSE -> safe error', async () => {
    const realFetch = global.fetch;
    global.fetch = async () => ({ ok: true, status: 200, body: { getReader: () => makeReader(['data: [DONE]\n\n']) } });
    try {
      await assert.rejects(
        () => pc.request({ url: 'x', headers: {}, body: {}, stream: true, getContent: () => undefined }),
        /empty response/
      );
    } finally { global.fetch = realFetch; }
  });

  await test('provider-common: network failure -> safe "could not reach"', async () => {
    const realFetch = global.fetch;
    global.fetch = async () => { throw new Error('ECONNREFUSED'); };
    try {
      await assert.rejects(() => pc.request({ url: 'x', headers: {}, body: {} }), /Could not reach/);
    } finally { global.fetch = realFetch; }
  });

  await test('ai-service: unknown/empty provider rejected safely', async () => {
    await assert.rejects(() => aiService.generate({ provider: 'bai', model: 'mimo-v2.5', prompt: 'x' }), (e) => e.safe === true);
    await assert.rejects(() => aiService.generate({ provider: '', model: '', prompt: 'x' }), (e) => e.safe === true);
  });

  await test('groq chat: one-shot (stubbed fetch) returns content', async () => {
    const realFetch = global.fetch;
    const keyEnv = aiModels.PROVIDERS.groq.keyEnv;
    const prevKey = process.env[keyEnv];
    process.env[keyEnv] = 'test-key';
    global.fetch = async (url) => {
      assert.ok(url === 'https://api.groq.com/openai/v1/chat/completions');
      return { ok: true, status: 200, body: {}, json: async () => ({ choices: [{ message: { content: 'GEN GROQ' } }] }) };
    };
    try {
      const { chat } = require('../ai/providers/groq-provider');
      const text = await chat({ prompt: 'p', model: 'openai/gpt-oss-120b' });
      assert.strictEqual(text, 'GEN GROQ');
    } finally { global.fetch = realFetch; restoreKey(keyEnv, prevKey); }
  });

  await test('openrouter chat: one-shot (stubbed fetch) returns content', async () => {
    const realFetch = global.fetch;
    const keyEnv = aiModels.PROVIDERS.openrouter.keyEnv;
    const prevKey = process.env[keyEnv];
    process.env[keyEnv] = 'test-key';
    global.fetch = async (url) => {
      assert.ok(url === 'https://openrouter.ai/api/v1/chat/completions');
      return { ok: true, status: 200, body: {}, json: async () => ({ choices: [{ message: { content: 'GEN OR' } }] }) };
    };
    try {
      const { chat } = require('../ai/providers/openrouter-provider');
      const text = await chat({ prompt: 'p', model: 'openrouter/free' });
      assert.strictEqual(text, 'GEN OR');
    } finally { global.fetch = realFetch; restoreKey(keyEnv, prevKey); }
  });

  await test('ai-service: selected provider receives the requested model', async () => {
    const realFetch = global.fetch;
    const prevKeys = setAllKeys();
    const seen = {};
    global.fetch = async (url, opts) => {
      seen.url = String(url);
      if (opts && opts.body) {
        const parsed = JSON.parse(opts.body);
        seen.model = parsed.model;
        seen.stream = !!parsed.stream;
      }
      const json = String(url).includes('generativelanguage')
        ? { candidates: [{ content: { parts: [{ text: 'GEN' }] } }] }
        : { choices: [{ message: { content: 'GEN' } }] };
      return { ok: true, status: 200, body: {}, json: async () => json };
    };
    try {
      const text = await aiService.generate({ provider: 'openrouter', model: 'openrouter/free', prompt: 'p' });
      assert.strictEqual(text, 'GEN');
      assert.strictEqual(seen.url, 'https://openrouter.ai/api/v1/chat/completions');
      assert.strictEqual(seen.model, 'openrouter/free');

      await aiService.generate({ provider: 'gemini', model: 'gemini-3.1-flash-lite', prompt: 'p' });
      assert.ok(seen.url.includes('/models/gemini-3.1-flash-lite:generateContent'), seen.url);
    } finally { global.fetch = realFetch; restoreAllKeys(prevKeys); }
  });

  await test('openrouter chat: streaming (stubbed fetch) accumulates + returns text', async () => {
    const realFetch = global.fetch;
    const keyEnv = aiModels.PROVIDERS.openrouter.keyEnv;
    const prevKey = process.env[keyEnv];
    process.env[keyEnv] = 'test-key';
    const reader = makeReader([
      'data: {"choices":[{"delta":{"content":"A"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"B"}}]}\n\n',
      'data: [DONE]\n\n',
    ]);
    global.fetch = async () => ({ ok: true, status: 200, body: { getReader: () => reader } });
    try {
      const { chat } = require('../ai/providers/openrouter-provider');
      const text = await chat({ prompt: 'p', model: 'openrouter/free', onDelta: () => {} });
      assert.strictEqual(text, 'AB');
    } finally { global.fetch = realFetch; restoreKey(keyEnv, prevKey); }
  });

  await test('gemini chat: one-shot (stubbed fetch) returns content', async () => {
    const realFetch = global.fetch;
    const keyEnv = aiModels.PROVIDERS.gemini.keyEnv;
    const prevKey = process.env[keyEnv];
    process.env[keyEnv] = 'test-key';
    global.fetch = async (url) => {
      assert.ok(String(url).includes('generateContent'), url);
      return { ok: true, status: 200, body: {}, json: async () => ({ candidates: [{ content: { parts: [{ text: 'GEN GEM' }] } }] }) };
    };
    try {
      const { chat } = require('../ai/providers/gemini-provider');
      const text = await chat({ prompt: 'p', model: 'gemini-3.1-flash-lite' });
      assert.strictEqual(text, 'GEN GEM');
    } finally { global.fetch = realFetch; restoreKey(keyEnv, prevKey); }
  });

  await test('gemini chat: streaming (stubbed fetch) accumulates + returns text', async () => {
    const realFetch = global.fetch;
    const keyEnv = aiModels.PROVIDERS.gemini.keyEnv;
    const prevKey = process.env[keyEnv];
    process.env[keyEnv] = 'test-key';
    const reader = makeReader([
      'data: {"candidates":[{"content":{"parts":[{"text":"A"}]}}]}\n\n',
      'data: {"candidates":[{"content":{"part":[{"text":"B"}]}}]}\n\n',
      'data: [DONE]\n\n',
    ]);
    global.fetch = async () => ({ ok: true, status: 200, body: { getReader: () => reader } });
    try {
      const { chat } = require('../ai/providers/gemini-provider');
      const text = await chat({ prompt: 'p', model: 'gemini-3.1-flash-lite', onDelta: () => {} });
      assert.strictEqual(text, 'AB');
    } finally { global.fetch = realFetch; restoreKey(keyEnv, prevKey); }
  });

  await test('ai-service: transient Gemini failure falls back to Groq', async () => {
    const realFetch = global.fetch;
    const prevKeys = setAllKeys();
    global.fetch = async (url) => {
      if (String(url).includes('generativelanguage')) {
        return { ok: false, status: 429, json: async () => ({ error: { message: 'rate limited' } }) };
      }
      if (String(url).includes('api.groq.com')) {
        return { ok: true, status: 200, body: {}, json: async () => ({ choices: [{ message: { content: 'GEN FALLBACK' } }] }) };
      }
      throw new Error('unexpected url ' + url);
    };
    try {
      const text = await aiService.generate({ provider: 'gemini', model: 'gemini-3.1-flash-lite', prompt: 'p' });
      assert.strictEqual(text, 'GEN FALLBACK');
    } finally { global.fetch = realFetch; restoreAllKeys(prevKeys); }
  });

  await test('ai-service: Gemini + Groq transient failures fall back to OpenRouter', async () => {
    const realFetch = global.fetch;
    const prevKeys = setAllKeys();
    global.fetch = async (url) => {
      if (String(url).includes('generativelanguage')) {
        return { ok: false, status: 429, json: async () => ({ error: { message: 'rate limited' } }) };
      }
      if (String(url).includes('api.groq.com')) {
        return { ok: false, status: 503, json: async () => ({ error: { message: 'provider outage' } }) };
      }
      if (String(url).includes('openrouter.ai')) {
        return { ok: true, status: 200, body: {}, json: async () => ({ choices: [{ message: { content: 'GEN OR' } }] }) };
      }
      throw new Error('unexpected url ' + url);
    };
    try {
      const text = await aiService.generate({ provider: 'gemini', model: 'gemini-3.1-flash-lite', prompt: 'p' });
      assert.strictEqual(text, 'GEN OR');
    } finally { global.fetch = realFetch; restoreAllKeys(prevKeys); }
  });

  await test('ai-service: auth errors DO NOT trigger fallback', async () => {
    const realFetch = global.fetch;
    const prevKeys = setAllKeys();
    const calls = [];
    global.fetch = async (url) => {
      calls.push(String(url));
      return { ok: false, status: 401, json: async () => ({ error: { message: 'bad key' } }) };
    };
    try {
      await assert.rejects(
        () => aiService.generate({ provider: 'gemini', model: 'gemini-3.1-flash-lite', prompt: 'p' }),
        (e) => e.status === 401
      );
      assert.strictEqual(calls.length, 1, 'only the selected provider may be called');
    } finally { global.fetch = realFetch; restoreAllKeys(prevKeys); }
  });

  console.log(`\nSmoke: ${passed} passed`);
}

function makeReader(chunks) {
  return { read: createChain(chunks.map((c) => Buffer.from(c))) };
}
function createChain(chunks) {
  let i = 0;
  return async () => {
    if (i >= chunks.length) return { done: true, value: undefined };
    return { done: false, value: chunks[i++] };
  };
}
function restoreKey(env, prev) {
  if (prev === undefined) delete process.env[env];
  else process.env[env] = prev;
}
function setAllKeys() {
  const prevKeys = {};
  for (const env of ['GEMINI_API_KEY', 'GROQ_API_KEY', 'OPENROUTER_API_KEY']) {
    prevKeys[env] = process.env[env];
    process.env[env] = 'test-key';
  }
  return prevKeys;
}
function restoreAllKeys(prevKeys) {
  for (const env of Object.keys(prevKeys)) restoreKey(env, prevKeys[env]);
}

main();