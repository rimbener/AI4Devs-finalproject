---
id: task-12
title: Operational docs and the SQL/RLS manual-verification checklist
slice: 3
scenarios: [s5, s6, s7]
status: todo
paths:
  - supabase/migrations/<ts1>_ai_provider_registry.sql
  - supabase/migrations/<ts2>_user_ai_keys_provider_fk.sql
  - tmp/ai-provider-registry-backend/verify-provider-registry.sql
---

## Goal
Close the verification gap this feature cannot automate. The repo has **no SQL test harness**, so the
schema, seed-parity and RLS scenarios are proven by a written, runnable checklist — and the operational
hazards are documented where an operator will actually see them.

## Done criteria
- [ ] Scenarios s5, s6, s7 have a runnable verification path (authored here; task-1 authors the DDL)
- [ ] `verify-provider-registry.sql` in `tmp/<feature>/` asserting:
      - the six providers and thirteen models match `gherkin-scenarios.md` `@s5` exactly, in order (s5)
      - an `authenticated` role can `select` both tables, disabled rows included, with the `enabled`
        flag visible (s6)
      - the `anon` role gets nothing, and no insert/update/delete policy exists for `anon` or
        `authenticated` (s7)
      - the vision-default uniqueness index and the vision-implies-capable check both reject a
        violating write (s2, s3)
      - the `user_ai_keys` FK rejects an unknown provider and blocks deleting a referenced one (s8, s9)
- [ ] Both migration headers carry: the reversibility note, and a prominent warning that
      `update ai_providers set enabled = false where id = 'groq'` **disables platform generation for
      every paid learner**
- [ ] A short "editing the catalog via Supabase Studio" runbook comment in the registry migration
- [ ] Deploy-ordering note recorded: `npx supabase db push` must land **before** the Edge Functions
      deploy, or both functions fail closed on a missing table
- [ ] `pnpm lint` green

## Notes
- **This is the feature's largest verification gap** (risks.md R1) and the reason the task exists.
  s1–s9 cannot be Jest-tested; the checklist is the substitute, following the existing "manual smoke"
  precedent set by `20260722000000_multi_provider_ai_keys.sql` and `risks.md R-enc`/`R1`/`R2`.
- **The RLS policy has no server-side consumer in this story** (decision D4): both Edge Functions read
  the catalog with the service-role client, which bypasses RLS. The `select to authenticated` policy's
  only real consumer is the paired frontend story — so without the s6/s7 check here we would ship a
  policy nothing has ever executed. Run it as an authenticated user, not as service role.
- The script lives under gitignored `tmp/<feature>/`, not `docs/` — it is run once and landed at PR
  time, like `risks.md`.
- Also record decision **D7**'s accepted risk in the migration runbook comment: inserting a provider
  row with no wired `@ai-sdk` factory yields an opaque `generation_failed` 502 and a storable but
  unusable key. Adding a provider is still **code + DB**, never DB alone.
