---
id: task-2
title: Replace user_ai_keys.provider's CHECK constraint with a real foreign key
slice: 1
scenarios: [s8, s9]
status: done
paths: [supabase/migrations/<ts2>_user_ai_keys_provider_fk.sql]
---

## Goal
Convert `user_ai_keys.provider` from a closed six-value `CHECK` into a genuine foreign key to
`ai_providers(id)` with `ON DELETE RESTRICT`, so integrity is enforced against live catalog rows
rather than a hardcoded list baked into a past migration.

**Owns** `@s8`–`@s9`. task-12 verifies them and claims no scenario ownership.

## Done criteria
- [ ] Scenarios s8, s9 implemented here (SQL verification via task-12)
- [ ] `alter table public.user_ai_keys drop constraint user_ai_keys_provider_check;`
- [ ] `alter table public.user_ai_keys add constraint user_ai_keys_provider_fkey
      foreign key (provider) references public.ai_providers (id);` — RESTRICT is the default and is
      what blocks deleting a referenced provider (s9)
- [ ] Migration timestamp sorts **after** task-1's
- [ ] **Authors** this migration's header comment: reversibility note showing how to restore the
      CHECK. task-12 verifies it exists; it does not write it.
- [ ] `pnpm lint` + `pnpm check-types` green

## Notes
- Decision: **D3** (two migrations, this one second). Rationale lives in `spec.md`.
- **Ordering is load-bearing**: adding the FK before task-1's seed rows exist would fail validation
  for every existing `user_ai_keys` row.
- Verified safe: the current `user_ai_keys_provider_check` already restricts `provider` to exactly
  the six ids task-1 seeds, so no existing row can violate the new FK.
- The CHECK is **dropped**, not kept alongside the FK — leaving it would re-impose a hardcoded
  allow-list and defeat the point of adding a provider without a deploy.
- `ON DELETE RESTRICT` is deliberate: `enabled = false` is the only supported way to retire a
  provider while learner keys exist for it.
- Do not touch the three `save_api_key` / `remove_api_key` / `get_api_key` RPCs here.
