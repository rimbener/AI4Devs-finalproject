---
id: task-4
title: manage-api-key Edge — widen allow-list + provider-scoped remove
slice: 1
scenarios: [s2, s4, s5, s9]
status: todo
paths: [supabase/functions/manage-api-key/provider.ts, supabase/functions/manage-api-key/handle-remove.ts, supabase/functions/manage-api-key/index.ts]
---

## Goal
Widen the Edge Function's provider allow-list to all six (`provider.ts` `AiProvider` union + `AI_PROVIDERS` array, hand-mirrored from `@helsoft/types`). `save` dispatch still validates `body.provider ∈ allow-list`. `remove` now requires and validates a `provider` in the body and calls `remove_api_key(p_user_id, p_provider)` (task-1 signature). Never log key material (existing redaction).

## Done criteria
- [ ] Scenario(s) s2, s4, s5, s9 covered by concrete Deno unit test(s)
- [ ] Closed six-provider allow-list; malformed/unknown provider → 400
- [ ] `remove` is provider-scoped; missing provider on remove → 400
- [ ] No key/body logging (redacted outcomes only)
- [ ] Manual smoke note recorded (Deno sits outside Jest/Stryker)

## Notes
Keep `provider.ts` in sync with `@helsoft/types` `AI_PROVIDERS` (parity note). Existing tests: `provider.test.ts`, `handle-remove.test.ts`, `handle-save.test.ts`.
