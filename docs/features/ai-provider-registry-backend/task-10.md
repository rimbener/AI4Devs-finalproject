---
id: task-10
title: Fail closed in manage-api-key when the catalog cannot be read
slice: 2
scenarios: [s26]
status: done
paths:
  - supabase/functions/manage-api-key/index.ts
  - supabase/functions/manage-api-key/provider.test.ts
---

## Goal
Guarantee that a failed catalog read in `manage-api-key` refuses the request instead of falling back
to a hardcoded allow-list — so a DB hiccup can never let a key be stored for a retired provider.

## Done criteria
- [x] Scenario s26 covered by a Deno test
- [x] A throwing catalog read → the existing catch-all responds **502** `{ code: 'network_error' }`
- [x] **No** Vault write and **no** `save_api_key` RPC occurs on that path
- [x] The failure is logged through `logEvent` with the redacted shape only — never the request body,
      never the key
- [x] No hardcoded provider list remains anywhere in `manage-api-key`
- [x] `pnpm lint` + `pnpm check-types` green; Deno tests pass

## Notes
- Decision: **D6** (fail closed, never treat an unreadable catalog as "assume enabled"). Rationale
  lives in `spec.md`.
- Like task-8, this needs **no new branch**: `index.ts` already wraps the whole handler in
  `try { … } catch { logEvent({ action, outcome: 'network_error', userId: 'unknown' }); return jsonResponse(request, 502, { code: 'network_error' }) }`.
  Letting the loader's rejection reach that catch *is* the implementation — assert it, don't add code.
- 502 `network_error` is the fail-closed shape because it is already in the `ApiKeyErrorCode` union,
  already mapped by `api-key.service.ts`, and already has copy — so this path needs nothing from the
  frontend story.
- Keep the existing redaction discipline (`@s12` of the original ai-key-management feature): the
  catch-all must not log the body or the key.
