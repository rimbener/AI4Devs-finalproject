import { assertEquals } from 'jsr:@std/assert@1';

import { handleSaveApiKey } from './handle-save.ts';

const params = { userId: 'user-1', provider: 'groq' as const, apiKey: 'sk-test-key' };

// @s1 (server half, task-2) -- the key is stored and the caller gets back a masked status
// only (never the raw key).
Deno.test('handleSaveApiKey stores the key and returns the full keys status', async () => {
  const storeCalls: unknown[] = [];
  const status = {
    keys: [{ provider: 'groq' as const, updatedAt: '2026-01-01T00:00:00.000Z' }],
  };
  const result = await handleSaveApiKey(params, {
    storeApiKey: (args) => {
      storeCalls.push(args);
      return Promise.resolve(status);
    },
    log: () => {},
  });

  assertEquals(storeCalls, [params]);
  assertEquals(result, status);
});

// @s12 -- across a full (successful) save run, the raw key value never appears in any log call.
Deno.test('handleSaveApiKey never logs the raw key value across a save run', async () => {
  const logCalls: unknown[] = [];
  await handleSaveApiKey(params, {
    storeApiKey: () =>
      Promise.resolve({
        keys: [{ provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' }],
      }),
    log: (event) => logCalls.push(event),
  });

  const serialized = JSON.stringify(logCalls);
  assertEquals(serialized.includes(params.apiKey), false);
  assertEquals(logCalls, [{ action: 'save', outcome: 'success', userId: 'user-1' }]);
});

// Engineering review — blank/whitespace keys rejected before store (@s12 input validation).
Deno.test('handleSaveApiKey rejects blank apiKey without calling storeApiKey', async () => {
  let storeCalled = false;
  const logCalls: unknown[] = [];
  const result = await handleSaveApiKey({ ...params, apiKey: '   ' }, {
    storeApiKey: () => {
      storeCalled = true;
      return Promise.resolve({ keys: [] });
    },
    log: (event) => logCalls.push(event),
  });

  assertEquals(storeCalled, false);
  assertEquals(result, { code: 'validation_error' });
  assertEquals(logCalls, [{ action: 'save', outcome: 'validation_error', userId: 'user-1' }]);
});
