---
id: task-12
title: Author the SQL/RLS manual-verification checklist and verify the migration headers
slice: 3
scenarios: []
verifies: [s1, s2, s3, s4, s5, s6, s7, s8, s9]
status: todo
paths:
  - tmp/ai-provider-registry-backend/verify-provider-registry.sql
---

## Goal
Close the verification gap this feature cannot automate. The repo has **no SQL test harness**, so the
schema, constraint, seed-parity, RLS and FK scenarios owned by task-1 and task-2 are proven by a
written, runnable checklist.

**Owns no scenarios.** `@s1`–`@s7` are implemented and owned by **task-1**; `@s8`–`@s9` by **task-2**.
This task is purely their verification mechanism — the `verifies:` list above records that
relationship without duplicating ownership.

## Done criteria
- [ ] `verify-provider-registry.sql` authored in `tmp/<feature>/`, asserting:
      - both tables and all their columns exist as specified (s1)
      - the vision-default uniqueness index and the vision-implies-capable check each reject a
        violating write (s2, s3)
      - deleting an unreferenced provider cascades its model rows (s4)
      - the six providers and thirteen models match `gherkin-scenarios.md` `@s5` exactly, in
        `sort_order` (s5)
      - an `authenticated` role can `select` both tables, disabled rows included, with the `enabled`
        flag visible (s6)
      - the `anon` role gets nothing, and no insert/update/delete policy exists for `anon` or
        `authenticated` (s7)
      - the `user_ai_keys` FK rejects an unknown provider and blocks deleting a referenced one (s8, s9)
- [ ] The script records the **deploy-ordering** requirement: `npx supabase db push` must land
      **before** the Edge Functions deploy, or both functions fail closed on a missing table
- [ ] **Verifies** (does not author) that task-1's migration header carries its reversibility note,
      the `groq` blast-radius warning and the Studio-edit runbook, and that task-2's carries its
      reversibility note. Report a gap back to task-1/task-2 rather than editing their files.
- [ ] `pnpm lint` green

## Notes
- Decisions: **D4** (service-role reads, so the RLS policy needs a manual check), **D7** (the accepted
  risk the runbook must mention). Rationale lives in `spec.md`.
- **This is the feature's largest verification gap** (risks.md R1). s1–s9 cannot be Jest-tested; this
  checklist is the substitute, following the manual-smoke precedent set by
  `20260722000000_multi_provider_ai_keys.sql` and prior `risks.md R1/R2/R-enc`.
- **Run the s6/s7 checks as an authenticated user and as `anon` — never as service role**, or they
  prove nothing (risks.md R5: the policy has no server-side consumer in this story).
- The script lives under gitignored `tmp/<feature>/`, not `docs/` — run once, landed at PR time like
  `risks.md`.
