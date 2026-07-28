---
feature: ai-provider-registry-backend
---

# Full review — ai-provider-registry-backend

Consolidated by `reviews_lead` from `review-engineering.md` (the sole full reviewer,
`reviewer_engineering`). Durable trail across rounds — findings kept forever, marked
`open`/`resolved`/`ACCEPTED`; never emptied.

## Round 1 (post-Slice-3, whole-branch diff `feature-entrega3-HernanLaura...HEAD`, 39 files, +2441/-228)

**CI (run once by `reviews_lead`): green @ `f3eb14a8c`**
- `pnpm lint` — 14/14 packages pass (cached, full turbo).
- `pnpm check-types` — 14/14 packages pass (cached, full turbo).
- `pnpm --filter @helsoft/supabase-services test` — 35/35 suites, 290/290 tests pass.
- `deno test --no-check=remote .` in `supabase/functions/manage-api-key` — 18/18 pass.
- `deno check *.ts` in `supabase/functions/manage-api-key` — clean.
- **Scoped out, not charged to this feature**: `deno check` on `supabase/functions/generate-lesson/index.ts`
  fails on `npm:zod@4` resolution — pre-existing Deno/pnpm-workspace tooling friction (`deno check`
  doesn't resolve npm deps the way `deno test --no-check=remote` does); not a regression, `deno test`
  itself is not run against this file in this repo (its logic is exercised via the Jest-side
  `libs/supabase-services` tests instead, per `review-slice.md`'s established precedent). Documented
  here as pre-existing debt, not silently absorbed.

**Reviewer**: `reviewer_engineering` (sole full reviewer — code quality/TDD, architecture/layering,
performance, security/OWASP), one pass over the whole feature-branch diff, not just the last slice.

**Verdict this round: CHANGES_REQUESTED** — 1 open finding (minor). Two additional items the
reviewer recorded are informational only (no severity assigned, no action requested) — see below.

### Findings

1. **`[arch]` Minor — resolved (round 1).** `supabase/functions/manage-api-key/index.ts:14-23,63-77,113-173`.
   The service-role `adminClient` parameter was retyped from the real `SupabaseClient` (from
   `jsr:@supabase/supabase-js@2`) to a locally-declared `AnySupabaseClient = any` to satisfy
   `loadProviderCatalog`'s structural `CatalogQueryClient` contract — but the `any` isn't scoped to
   the two `loadProviderCatalog(adminClient, ...)` call sites; it widens the parameter type of
   `listUserApiKeys` and `dispatch` themselves, so every other use of `adminClient` in this file
   (`.from('user_ai_keys').select(...)`, `.rpc('remove_api_key', ...)`, `.rpc('save_api_key', ...)`)
   loses type checking too. Not a security leak (no unvalidated row shape reaches a trust boundary —
   `listUserApiKeys` still casts to the explicit `UserAiKeyRow` type, `loadProviderCatalog`'s
   `ProviderEntry | null` return type is unaffected, both RPC calls check `{ error }` before use), but
   a real regression versus the file's own pre-diff typing: unlike `generate-lesson/index.ts`'s
   pre-existing, untouched `AnySupabaseClient` (which sits in a file `deno check` can't currently
   evaluate at all, per the CI scoping note above), `manage-api-key`'s `deno check` **is** green in
   this run — so this diff gives up a check that was actually running and passing before this feature.
   **Fix**: scope the cast to the two `loadProviderCatalog(adminClient, ...)` call sites only (e.g.
   `loadProviderCatalog(adminClient as unknown as Parameters<typeof loadProviderCatalog>[0], ...)`),
   keeping `adminClient: SupabaseClient` on `listUserApiKeys`/`dispatch` so the rest of the file's
   Supabase calls keep real type checking.
   **Resolved**: `listUserApiKeys`/`dispatch` restored to `adminClient: SupabaseClient` (imported
   `type SupabaseClient` from `jsr:@supabase/supabase-js@2`); `AnySupabaseClient` now only used as
   an inline `adminClient as AnySupabaseClient` cast at the two `loadProviderCatalog(...)` call
   sites in `dispatch` (save + remove branches). Re-verified: `deno check *.ts` in
   `supabase/functions/manage-api-key` clean (`index.ts` included), `deno test --no-check=remote .`
   18/18 green, `pnpm --filter @helsoft/supabase-services test` 35/35 suites green, repo-wide
   `pnpm format`/`check-types`/`lint` clean (14/14 packages).

### Informational only — not findings requiring a fix (recorded per reviewer's own framing)

- **`[code]` duplicate `AiProvider` type declaration** (`generate-lesson/_shared/types.ts:10` and
  `_shared/models.ts:10`, both `export type AiProvider = string`) — pre-dates this feature (both
  files already hand-mirrored the union before D6); this diff only widened both consistently. No
  action requested.
- **`[security]` D4's unconsumed `authenticated` select RLS policy** (`ai_providers_select_authenticated`
  / `ai_provider_models_select_authenticated`, `supabase/migrations/20260726185408_ai_provider_registry.sql:28-35,57-64`)
  — no server-side consumer yet (both Edge Functions read via service-role, D4); this is exactly what
  D4/`risks.md` R5 already documents and defers to task-12's manual verification, not a new gap now
  that all slices have landed. `anon` confirmed to get no grant/policy on either table (@s7 holds).

### Verified clean (no findings) — see `review-engineering.md` for full detail, not restated here

- Fail-closed correctness (D6, Slice-2's Major finding) re-verified solid across three independent
  test harnesses — not re-broken.
- Rejection matrix (D10-D14) consistent end-to-end across `manage-api-key/provider.ts`,
  `lesson-generation.validation.ts`, `lesson-generation.route.ts`, `_shared/types.ts`.
- Migrations (RLS/grants/FK: partial unique index, vision-implies-capable check, cascade, restrict,
  exact seed match) all correct.
- Cross-layer wiring (@s27/@s28) genuine, not a re-implementation; no-cache proof holds.
- TDD/coverage: all 28 `@s` scenarios mapped to ≥1 concrete test; no dead/orphaned/contradicted test
  surface across slices.
- Architecture/layering: no cross-layer leak, `types.mdc` extraction from Slice 1 held, no new deps,
  no business logic leaked into `apps/*`.
- Security (OWASP): userId derived from caller's own JWT (A01), parameterized queries throughout (A03),
  no PII/secrets in logs, no hardcoded secrets.
- Performance: single scoped query per request by design (D8/D9), no N+1, no UI surface in this
  backend-only diff.

## Round 2 (fix-only re-review, commit `83c0504c3`)

**CI (re-run once by `reviews_lead`): green @ `83c0504c3`**
- `pnpm lint` — 14/14 packages pass.
- `pnpm check-types` — 14/14 packages pass.
- `pnpm --filter @helsoft/supabase-services test` — 35/35 suites, 290/290 tests pass.
- `deno test --no-check=remote .` in `supabase/functions/manage-api-key` — 18/18 pass.
- `deno check *.ts` in `supabase/functions/manage-api-key` — clean.
- Scope check (own verification, not on trust): `git log --oneline f3eb14a8c..HEAD` shows exactly
  two commits since the round-1-reviewed sha — `4588fbd43` (docs-only, round-1 write-up) and
  `83c0504c3` (the fix). `git diff --stat` confirms the only non-docs file touched is
  `supabase/functions/manage-api-key/index.ts` (+13/-12); `tasks.md` is a one-line docs edit.

**Reviewer**: `reviewer_engineering`, re-invoked for round 2 — verified finding #1's fix directly
(read the full current `index.ts` and the exact fix-commit diff, not the implementer's changelog
note alone) and did a fresh full-diff pass over all four lenses (code quality/TDD, architecture,
performance, security) to catch anything new since round 1.

**Verdict this round: APPROVED** — zero open findings of any severity.

### Findings

1. **`[arch]` Minor — RE-VERIFIED RESOLVED (round 2).**
   `supabase/functions/manage-api-key/index.ts`. Confirmed directly by `reviewer_engineering`,
   not on the strength of implementer's claim alone:
   - `import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';` (line 7) —
     real type imported.
   - `listUserApiKeys` (line 66-69) and `dispatch` (line 116-120) both declare
     `adminClient: SupabaseClient` — the real type, not `AnySupabaseClient`.
   - `AnySupabaseClient`/`any` used **only** as an inline `adminClient as AnySupabaseClient` cast
     at the two `loadProviderCatalog(...)` call sites: line 126 (remove branch), line 154 (save
     branch). Grepped the whole file — no third occurrence.
   - Every other `adminClient` use back under real type checking:
     `.from('user_ai_keys').select(...)` (70-73), `.rpc('remove_api_key', ...)` (135-138),
     `.rpc('save_api_key', ...)` (164-168).
   - Fix commit itself introduces no regression: diff limited to the import line, one comment
     block, two signatures, two casts — no logic/control-flow change. `errorStatus`,
     `authenticateCaller`, the `Deno.serve` fail-closed-502 path, `logEvent`'s redacted-log call
     all byte-identical to round 1.
   **Status: resolved, reviewer-verified.**

### Informational only — carried forward, unchanged (not new gaps)

- **`[code]` duplicate `AiProvider` type declaration** (`generate-lesson/_shared/types.ts:10` /
  `_shared/models.ts:10`) — re-confirmed unchanged this round, still pre-dates this feature, no
  action requested.
- **`[security]` D4's unconsumed `authenticated` select RLS policy** (migration
  `20260726185408_ai_provider_registry.sql:28-35,57-64`) — re-confirmed unchanged this round,
  still matches documented D4/risks.md R5, deferred to task-12/paired frontend story, not a new
  gap.

### Fresh full-diff pass (round 2, all four lenses) — zero new findings

- **Code quality/TDD**: fix is a type-annotation-only change (two signatures + two inline casts);
  no new behavior, no new test surface required; unchanged 18/18 Deno + 35/35 Jest counts confirm
  no behavior moved.
- **Architecture/layering**: fix entirely internal to one Edge Function's file-local type
  annotations; no cross-layer import changed, no DTO shape changed, no new dependency.
- **Performance**: no runtime behavior difference — same query, same RPC calls, same call count.
  Round 1's "single scoped query per request" finding still holds.
- **Security (OWASP)**: no new attack surface; fix marginally *improves* the security posture by
  restoring compile-time type safety on the two `.rpc(...)` calls and the `user_ai_keys` select.
  No secrets, no PII, no new trust-boundary crossing.
- Spot-checked (not re-derived from scratch, since no other file changed since round 1):
  `_shared/provider-catalog.ts`'s fail-closed `if (error) throw error;` — byte-identical to
  round 1; the migration's `revoke all ... from anon, authenticated` / `grant select ... to
  authenticated` / `grant all ... to service_role` triad on both `ai_providers`/
  `ai_provider_models` — byte-identical to round 1.

## Final verdict: APPROVED

Zero open findings of any severity after round 2. Round-1's single minor finding is resolved and
independently reviewer-verified (not implementer-claim-only). No new findings surfaced in the
round-2 fresh full-diff pass. The two informational items (duplicate `AiProvider` type; D4's
unconsumed RLS policy) remain informational, carried forward for `dod_validator`'s awareness —
not blockers, not action items.

Feature `ai-provider-registry-backend` proceeds to `mutation_tester` (StrykerJS, once, after this
full review) per the orchestrator pipeline.
