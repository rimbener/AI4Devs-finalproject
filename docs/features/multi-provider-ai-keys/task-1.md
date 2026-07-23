---
id: task-1
title: Composite-PK migration + provider-scoped RPCs
slice: 1
scenarios: [s4, s5, s9]
status: done
paths: [supabase/migrations/]
---

## Goal
Migrate `user_ai_keys` from `user_id` PK to composite PK `(user_id, provider)` so a user holds ≤1 key per provider. Add a DB `CHECK (provider in ('groq','openai','anthropic','google','xai','deepseek'))`. Redefine the three SECURITY DEFINER, service_role-only RPCs: `save_api_key` upserts `ON CONFLICT ON CONSTRAINT user_ai_keys_pkey` with a per-provider Vault secret (`user_ai_key_<uid>_<provider>`) and table-qualified RETURNING cols; `get_api_key(p_user_id, p_provider)` returns that provider's decrypted key; `remove_api_key(p_user_id, p_provider)` deletes only that provider's row + its Vault secret. Grant `SELECT` on `user_ai_keys` to `service_role` (Edge list). Existing single `provider='groq'` rows migrate in place (no backfill).

## Done criteria
- [ ] Scenario(s) s4, s5, s9 covered by concrete migration test(s)
- [ ] Composite PK + CHECK constraint; RLS select-own retained (now multi-row); no client insert/update/delete grant; service_role SELECT for Edge
- [ ] `save`/`get`/`remove` RPC signatures + Vault behavior updated; per-provider secret naming; no ambiguous `provider` in RETURNING
- [ ] Reversibility note documented (down steps in comment, CLI does not auto-generate)
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Mirror the existing migration style/comments (`20260710223250_user_ai_keys.sql`, `remove_api_key.sql`, `get_api_key.sql`). Keep the Vault-vs-pgcrypto fallback caveat. Table stores metadata + `secret_id` only — never key material (s9). Follow-up migration `20260723210000_fix_save_api_key_ambiguous_provider.sql` for live DBs that already applied the ambiguous `ON CONFLICT (user_id, provider)` + missing service_role SELECT.
