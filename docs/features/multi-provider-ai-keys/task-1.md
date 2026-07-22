---
id: task-1
title: Composite-PK migration + provider-scoped RPCs
slice: 1
scenarios: [s4, s5, s9]
status: todo
paths: [supabase/migrations/]
---

## Goal
Migrate `user_ai_keys` from `user_id` PK to composite PK `(user_id, provider)` so a user holds ≤1 key per provider. Add a DB `CHECK (provider in ('groq','openai','anthropic','google','xai','deepseek'))`. Redefine the three SECURITY DEFINER, service_role-only RPCs: `save_api_key` upserts `on conflict (user_id, provider)` with a per-provider Vault secret (`user_ai_key_<uid>_<provider>`); `get_api_key(p_user_id, p_provider)` returns that provider's decrypted key; `remove_api_key(p_user_id, p_provider)` deletes only that provider's row + its Vault secret. Existing single `provider='groq'` rows migrate in place (no backfill).

## Done criteria
- [ ] Scenario(s) s4, s5, s9 covered by concrete migration test(s)
- [ ] Composite PK + CHECK constraint; RLS select-own retained (now multi-row); no client insert/update/delete grant
- [ ] `save`/`get`/`remove` RPC signatures + Vault behavior updated; per-provider secret naming
- [ ] Reversibility note documented (down steps in comment, CLI does not auto-generate)
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Mirror the existing migration style/comments (`20260710223250_user_ai_keys.sql`, `remove_api_key.sql`, `get_api_key.sql`). Keep the Vault-vs-pgcrypto fallback caveat. Table stores metadata + `secret_id` only — never key material (s9).
