// Smoke tests for the two-provider AI system (no external calls, no keys required).
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
    assert.strictEqual(aiModels.DEFAULT_PROVIDER, 'unorouter');
    assert.strictEqual(aiModels.DEFAULT_MODEL, 'codestral-latest');
    const meta = JSON.stringify(aiModels.safeModelMetadata());
    assert.ok(!meta.includes('API_KEY'), 'metadata must never leak key env names');
    assert.ok(meta.includes('UnoRouter'));
    assert.ok(meta.includes('gemini-3.1-flash-lite'));
  });

  await test('ai-models: valid provider/model pairs accepted', () => {
    assert.deepStrictEqual(aiModels.assertValidProviderModel('unorouter', 'codestral-latest'), { provider: 'unorouter', model: 'codestral-latest' });
    assert.deepStrictEqual(aiModels.assertValidProviderModel('GEMINI', 'Gemini-3.1-Flash-Lite'), { provider: 'gemini', model: 'gemini-3.1-flash-lite' });
  });

  await test('ai-models: :free / legacy B.AI / unknown all rejected', () => {
    assert.throws(() => aiModels.assertValidProviderModel('unorouter', 'codestral-latest:free'), /not a valid model/);
    assert.throws(() => aiModels.assertValidProviderModel('unorouter', 'mimo-v2.5'), /not a valid model/);
    assert.throws(() => aiModels.assertValidProviderModel('bai', 'anything'), /Unknown AI provider/);
    assert.throws(() => aiModels.assertValidProviderModel('gemini', 'codestral-latest'), /not a valid model/);
    assert.throws(() => aiModels.assertValidProviderModel('', 'codestral-latest'), /Unknown AI provider/);
  });

  await test('provider-common: missing key -> safe, user-readable', () => {
    const keyEnv = aiModels.PROVIDERS.unorouter.keyEnv;
    const prev = process.env[keyEnv];
    delete process.env[keyEnv];
    try {
      assert.throws(() => pc.getApiKey(aiModels.PROVIDERS.unorouter), (e) => {
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
        url: 'unorouter', headers: {}, body: {}, stream: true,
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

  await test('unorouter chat: one-shot (stubbed fetch) returns content', async () => {
    const realFetch = global.fetch;
    const keyEnv = aiModels.PROVIDERS.unorouter.keyEnv;
    const prevKey = process.env[keyEnv];
    process.env[keyEnv] = 'test-key';
    global.fetch = async (url) => {
      assert.ok(url === 'https://api.unorouter.com/v1/chat/completions');
      return { ok: true, status: 200, body: {}, json: async () => ({ choices: [{ message: { content: 'GEN UNO' } }] }) };
    };
    try {
      const unorouter = require('../ai/providers/unorouter-provider');
      const text = await unorouter.chat({ prompt: 'p', model: 'codestral-latest' });
      assert.strictEqual(text, 'GEN UNO');
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

main();