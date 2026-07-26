---
id: task-9
title: Replace manage-api-key's hardcoded allow-list with the catalog-backed rejection matrix
slice: 2
scenarios: [s22, s23, s24, s25]
status: done
paths:
  - supabase/functions/manage-api-key/provider.ts
  - supabase/functions/manage-api-key/index.ts
  - supabase/functions/manage-api-key/provider.test.ts
---

## Goal
Retire `isAiProvider`'s hardcoded six-value allow-list in favour of the catalog, and implement the
agreed asymmetry: saving a key for a disabled provider is refused, while removing one is always
allowed so a learner can revoke a credential they gave us.

## Done criteria
- [x] Scenarios s22–s25 covered by Deno tests (`deno test --no-check=remote .`)
- [x] `provider.ts`'s hardcoded `AI_PROVIDERS` list **deleted**; the guard now decides from a
      `ProviderEntry` supplied by `_shared/provider-catalog.ts`
- [x] `index.ts` loads the entry **once** per request via the existing service-role `adminClient`
- [x] The full matrix, exactly:
      - save + disabled → **400** `{ code: 'provider_disabled' }`, no Vault write (s22)
      - save + unknown → **400** `{ code: 'network_error' }`, unchanged from today (s23)
      - remove + disabled → **allowed**, 200 with the refreshed key list (s24)
      - remove + unknown → **400** `{ code: 'network_error' }`, unchanged from today (s25)
- [x] The disabled check happens **before** any `save_api_key` RPC / Vault call
- [x] `remove` never consults `enabled` at all — only provider existence
- [x] `libs/` is **not** touched by this task
- [x] `pnpm lint` + `pnpm check-types` green; Deno tests pass

## Notes
- Decisions: **D10** (save rejected / remove always allowed), **D12** (`provider_disabled` only for
  genuinely disabled; unknown keeps `network_error`), **D11** (the `ApiKeyErrorCode` widening, copy
  and `api-key.service.ts` mapping are frontend-story scope). Rationale lives in `spec.md`.
- The frontend story has been amended to cite D10/D11/D12 and no longer contradicts this matrix. Do
  not edit that story from this task.
- Implementation detail: `remove_api_key` is a plain delete on `(user_id, provider)` and does not care
  about `enabled`, so allowing remove costs nothing.
- The scoped loader distinguishes the two rejection causes for free: `null` = unknown, row with
  `enabled === false` = disabled.
- Today's unknown-provider path is `dispatch` returning `null` → `400 { code: 'network_error' }`.
  Preserve that path for unknown; add a distinct branch for disabled.
- `provider.test.ts` currently asserts a synchronous six-provider allow-list. Rewrite it against
  plain `ProviderEntry` fixtures — the guard stays synchronous, so the Deno suite survives.
