import { assertEquals } from 'jsr:@std/assert@1';

import { handleRemoveApiKey } from './handle-remove.ts';

const params = { userId: 'user-1', provider: 'groq' as const };
const remainingStatus = {
  keys: [{ provider: 'openai' as const, updatedAt: '2026-02-01T00:00:00.000Z' }],
};

// @s5 (server half) — a successful remove deletes the provider's Vault secret + row and
// replies with the updated multi-key status.
Deno.test('handleRemoveApiKey removes the stored key and returns the updated keys status', async () => {
  const removeCalls: unknown[] = [];
  const result = await handleRemoveApiKey(params, {
    removeApiKey: (args) => {
      removeCalls.push(args);
      return Promise.resolve(remainingStatus);
    },
    log: () => {},
  });

  assertEquals(removeCalls, [params]);
  assertEquals(result, remainingStatus);
});

// @s5 (failure) — a failed remove normalizes to network_error
Deno.test('handleRemoveApiKey returns network_error when the removal fails', async () => {
  const result = await handleRemoveApiKey(params, {
    removeApiKey: () => Promise.reject(new Error('delete failed')),
    log: () => {},
  });

  assertEquals(result, { code: 'network_error' });
});

// @s9 — the log call carries only { action, outcome, userId } — never key material
Deno.test('handleRemoveApiKey logs only { action, outcome, userId } on success', async () => {
  const logCalls: unknown[] = [];
  await handleRemoveApiKey(params, {
    removeApiKey: () => Promise.resolve({ keys: [] }),
    log: (event) => logCalls.push(event),
  });

  assertEquals(logCalls, [{ action: 'remove', outcome: 'success', userId: 'user-1' }]);
});

// @s2/@s5 — the provider is forwarded to the remove RPC (per-provider remove)
Deno.test('handleRemoveApiKey passes the provider to the injected removeApiKey', async () => {
  const removeCalls: unknown[] = [];
  await handleRemoveApiKey({ userId: 'u1', provider: 'openai' }, {
    removeApiKey: (args) => {
      removeCalls.push(args);
      return Promise.resolve({ keys: [] });
    },
    log: () => {},
  });

  assertEquals(removeCalls, [{ userId: 'u1', provider: 'openai' }]);
});
