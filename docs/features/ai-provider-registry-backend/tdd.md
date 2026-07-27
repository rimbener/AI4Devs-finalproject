---
feature: ai-provider-registry-backend
slice: 3 (integration + operational verification) — tasks 11-12
---

# TDD log

## Limitation (explicit, unchanged across all 3 slices)
No live Supabase project in this sandbox. s1-s9 (schema/RLS/FK) proven by SQL review + task-12's
runnable checklist, never executed here. `manage-api-key` has a `deno.json` (Deno suite runs
here); `generate-lesson/index.ts` has none — hand-verified/manual-smoke only, unchanged since
Slice 1.

## Slice 1 (tasks 1-6, all green, review round-1's 3 findings resolved)
| `@s` | Test | task |
|---|---|---|
| s1-s9 | SQL review only (task-12 script) | 1/2 migrations |
| s10-s11 | `provider-catalog.test.ts` | 3: loader + `ProviderEntry` |
| s12/s19 | `lesson-generation.validation.test.ts` | 4: hardcoded registries deleted, `AiProvider` -> string |
| s13-s15 | `lesson-generation.vision-model.test.ts` | 5: `resolveVisionModelForPlacement` |
| s16 | `lesson-generation.key-routing.integration.test.ts` | 6: entry threaded route.ts/index.ts (D9) |
Fixes: extracted `provider-catalog.types.ts`; deleted dead types; explicit FK `on delete restrict`.

## Slice 2 (tasks 7-10, `@s` -> test map)
| `@s` | Behaviour | Test |
|---|---|---|
| s17 | BYOK disabled -> `provider_disabled`, no Vault read | `lesson-generation.validation.test.ts` |
| s18 | unknown provider stays `invalid_model` | pre-existing + integration test |
| s20 | platform provider disabled -> `platform_key_unavailable`, no slot | `key-routing.integration.test.ts` |
| s21 | catalog throw propagates (no fallback list) | `key-routing.integration.test.ts` |
| s22-s25 | save/remove guard matrix (D10/D12) | `provider.test.ts` (`guardSaveProvider`/`guardRemoveProvider`) |
| s26 | catalog throw propagates in manage-api-key | `provider.test.ts` |
Cycles: task-7 widened `validateByokGenerationRequest`/route.ts's platform branch to gate on
`entry.enabled` before key resolution. task-8/task-10: s18/s26 needed no new branch, only a new
test proving existing propagation. task-9 replaced the `AI_PROVIDERS` allow-list with
catalog-backed `guardSaveProvider`/`guardRemoveProvider`; `dispatch` loads the entry once per
action branch. Review-round-1 fix-up (1 Major): a real Supabase query failure **resolves**
`{ data: null, error }`, it never rejects — `loadProviderCatalog` was destructuring only `{ data
}`, silently mapping an outage to "unknown provider". Fixed with `if (error) throw error;`
(matches sibling RPC convention); added a resolved-error-shape test case per fail-closed site.

## Slice gate (1+2)
`pnpm --filter @helsoft/supabase-services test` 34/288 green; `deno test --no-check=remote .`
(manage-api-key) 18/18 green + `deno check` clean; repo-wide `check-types`/`format`/`lint` clean
(14/14 packages). `libs/` untouched beyond the two named test files.

## Slice 3 (tasks 11-12)

**task-11 (@s27/@s28) — integration test, `libs/supabase-services/src/services/provider-catalog.integration.test.ts`:**
All production logic for s27/s28 already existed (built across Slices 1-2) — this is a pure
verification integration test, no new production code, per its own Done criteria ("no code
change" is the point of s27). Mocks only the client boundary (`from().select().eq().maybeSingle()`),
same as `provider-catalog.test.ts`; wires the real `loadProviderCatalog` into the real
`handleLessonGenerationRoute`, and calls the real `isValidModelForProvider` /
`resolveVisionModelForPlacement` directly.
- Test 1 (@s27): one mocked provider entry drives model-validity, vision-placement and route
  decisions; then the mocked row is edited in place (renamed, model swapped) with **zero code
  change**, and the exact same call chain flips its decision — the no-deploy promise proven
  mechanically.
- Test 2 (@s28): same `client`/`loadProviderEntry` closure across two `handleLessonGenerationRoute`
  calls; first resolves `ok:true`, then the mocked row flips `enabled:false`, second call refuses
  as `provider_disabled` with `readUserApiKey` never reached the second time. Written so a future
  module-level cache in `loadProviderCatalog` would make this fail (D9 regression guard).
- Ran green on first write (RED had nothing to fail against — verification-only task); full
  `@helsoft/supabase-services` suite: 35/290 green.

**task-12 (verifies s1-s9, owns none) — `tmp/ai-provider-registry-backend/verify-provider-registry.sql`:**
Not TDD'able (no SQL harness in this repo, risks.md R1) — authored a runnable, idempotent
checklist instead: schema check (s1), transaction-wrapped rejection proofs for s2/s3/s4 (each
rolled back), a two-way `except` diff of live rows against the exact `@s5` table, `set role
authenticated`/`set role anon` reads for s6/s7 (never service_role, risks.md R5), and an
`auth.users`-scoped FK proof for s8/s9 (skips gracefully if no test user exists yet). Documents
the deploy-ordering requirement (migrations before Edge deploy, risks.md R2) and a concrete
Studio-edit runbook (rename/disable/reorder/add-model/change-vision-default), which risks.md
R3/R4 assign to task-12, not task-1's header. **Verified, did not edit**, task-1/task-2's headers:
both carry their reversibility note; task-1 also carries the groq blast-radius warning. No gap to
report — task-1's header names Studio-editability as its rationale; the concrete runbook lives in
this script per risks.md's own assignment (reconciliation recorded in the script's tail comment).

## Slice 3 gate
`pnpm --filter @helsoft/supabase-services test` — 35 suites / 290 tests green (+1 suite, +2 tests
over Slice 2). `pnpm format` clean (1 file auto-formatted). Repo-wide `pnpm check-types` and
`pnpm lint` (`--output-logs=errors-only`) — 14/14 packages clean. `verify-provider-registry.sql`
lives under gitignored `tmp/`, out of Biome's scope; not executable in this sandbox (no live
Supabase project, no `psql`) — same limitation slice 1 recorded for the migrations themselves.

All 28 `@s` scenarios are now implemented or verified across the 3 slices: s1-s9 SQL-verified
only (task-12, no Jest harness exists for them); s10-s28 Jest/Deno-tested (Slices 1-2's suites
plus task-11's cross-layer integration test).
