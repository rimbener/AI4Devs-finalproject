import { assertEquals, assertRejects } from 'jsr:@std/assert@1';

import { loadProviderCatalog } from '../_shared/provider-catalog.ts';
import type { ProviderEntry } from '../_shared/provider-catalog.types.ts';
import { guardRemoveProvider, guardSaveProvider } from './provider.ts';

const enabledEntry: ProviderEntry = {
  id: 'anthropic',
  name: 'Anthropic',
  guidanceUrl: null,
  enabled: true,
  sortOrder: 3,
  models: [],
};

const disabledEntry: ProviderEntry = { ...enabledEntry, enabled: false };

// @s22 — saving a key for a disabled provider is refused as provider_disabled.
Deno.test('guardSaveProvider rejects a disabled provider entry as provider_disabled', () => {
  assertEquals(guardSaveProvider(disabledEntry), { ok: false, code: 'provider_disabled' });
});

// @s23 — saving a key for an unknown provider (no catalog row) stays network_error, unchanged.
Deno.test('guardSaveProvider rejects a missing (unknown) provider entry as network_error', () => {
  assertEquals(guardSaveProvider(null), { ok: false, code: 'network_error' });
});

Deno.test('guardSaveProvider allows an enabled provider entry', () => {
  assertEquals(guardSaveProvider(enabledEntry), { ok: true });
});

// @s24 — removing a key for a disabled provider is always allowed; only existence matters.
Deno.test('guardRemoveProvider allows a disabled provider entry', () => {
  assertEquals(guardRemoveProvider(disabledEntry), { ok: true });
});

// @s25 — removing a key for an unknown provider stays network_error, unchanged.
Deno.test('guardRemoveProvider rejects a missing (unknown) provider entry as network_error', () => {
  assertEquals(guardRemoveProvider(null), { ok: false, code: 'network_error' });
});

Deno.test('guardRemoveProvider allows an enabled provider entry', () => {
  assertEquals(guardRemoveProvider(enabledEntry), { ok: true });
});

// @s26 — a genuinely exceptional client rejection (not the ordinary DB-failure shape below) still
// propagates rather than being swallowed; index.ts's existing top-level try/catch is what turns
// this propagation into the fail-closed 502 network_error response (task-10 note: no new branch,
// just verified propagation here).
Deno.test(
  'loadProviderCatalog propagates a rejected catalog read instead of swallowing it',
  async () => {
    const failingClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.reject(new Error('catalog read failed')),
          }),
        }),
      }),
    };

    await assertRejects(
      () => loadProviderCatalog(failingClient, 'anthropic'),
      Error,
      'catalog read failed',
    );
  },
);

// @s26 (reviewer_slice round-1 fix) — a real Supabase/postgrest query failure (RLS block,
// connection drop, DB outage) RESOLVES as `{ data: null, error }`; it does not reject the
// promise. Only this shape genuinely proves the s26 fail-closed claim -- the rejection case
// above alone would let a real DB outage silently pass through as `null` ("provider unknown")
// if `loadProviderCatalog` didn't also check `error`.
Deno.test(
  'loadProviderCatalog throws on a real resolved-error catalog read (not just a rejection)',
  async () => {
    const failingClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: null, error: new Error('catalog read failed') }),
          }),
        }),
      }),
    };

    await assertRejects(
      () => loadProviderCatalog(failingClient, 'anthropic'),
      Error,
      'catalog read failed',
    );
  },
);
