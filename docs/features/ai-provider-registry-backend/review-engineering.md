---
feature: ai-provider-registry-backend
---

# Full engineering review — ai-provider-registry-backend

Round 1 (post-Slice-3, whole-branch diff `feature-entrega3-HernanLaura...HEAD`, CI green @ f3eb14a8c).
Durable trail — never emptied; fixed findings marked `resolved`, kept.

## Verdict: APPROVED

Reviewed via `git diff feature-entrega3-HernanLaura...HEAD` (39 files, +2441/-228), `gherkin-scenarios.md`
(28 `@s`), `tdd.md`, `spec.md` (D1-D17), `review-slice.md` (3 slices, all prior findings resolved).
No blocker or major found. Two minor findings below; everything else checked out.

## Findings

### 1. `[arch]` Minor — resolved — `supabase/functions/manage-api-key/index.ts:14-23,63-77,113-173`
The service-role `adminClient` parameter was retyped from the real `SupabaseClient` (imported
from `jsr:@supabase/supabase-js@2`) to a locally-declared `AnySupabaseClient = any` to satisfy
`loadProviderCatalog`'s structural `CatalogQueryClient` contract at two call sites
(`dispatch`'s `loadProviderCatalog(adminClient, body.provider)` for both the `save` and `remove`
branches). The `any` is not scoped to those two call sites — it widens the parameter type of
`listUserApiKeys` and `dispatch` themselves, so every other use of `adminClient` in this file
(`.from('user_ai_keys').select(...)`, `.rpc('remove_api_key', ...)`, `.rpc('save_api_key', ...)`)
loses type checking too.

This is judged **contained, not a security leak** — no untyped row shape reaches a trust boundary
without validation: `listUserApiKeys` still declares and casts to the explicit `UserAiKeyRow`
type before returning, `guardSaveProvider`/`guardRemoveProvider` consume `loadProviderCatalog`'s
still-fully-typed `ProviderEntry | null` return value (that return type is unaffected by the
client parameter being `any`), and the two RPC calls' `{ error }` are checked and re-thrown before
any data is used. So no unvalidated data crosses into `save_api_key`/`remove_api_key`.

It is, however, a real (if modest) regression versus the pre-existing generate-lesson precedent
cited as justification: `generate-lesson/index.ts`'s own `AnySupabaseClient` is *pre-existing*,
untouched by this diff, and sits in a file `deno check` cannot currently type-check at all (per
CI notes — the npm:zod resolution failure is unrelated tooling debt, pre-existing). By contrast,
`manage-api-key`'s `deno check` **is** green in this CI run, so widening this file's client type
to `any` gives up a check that was actually running and passing before this feature. A narrower
fix — casting only at the two `loadProviderCatalog(adminClient, ...)` call sites (e.g.
`loadProviderCatalog(adminClient as unknown as Parameters<typeof loadProviderCatalog>[0], ...)`)
while keeping `adminClient: SupabaseClient` on `listUserApiKeys`/`dispatch` — would keep the
escape hatch scoped to the actual structural mismatch instead of the whole function. Not worth a
blocking re-review given the file's own documented manual-smoke-only verification convention
(risks.md R1) and that no data-shape bug is actually observable today, but worth doing opportunistically
next time this file is touched.

**Resolved (implementer, same day)**: applied exactly the fix above. `listUserApiKeys` and
`dispatch` now take `adminClient: SupabaseClient` (real type, imported from
`jsr:@supabase/supabase-js@2`); `AnySupabaseClient` is used only as an inline
`adminClient as AnySupabaseClient` cast at `dispatch`'s two `loadProviderCatalog(...)` call sites
(save branch, remove branch). Every other `adminClient` use in the file
(`.from('user_ai_keys').select(...)`, both `.rpc(...)` calls) is back under real `SupabaseClient`
type checking. Re-ran `deno check *.ts` in `supabase/functions/manage-api-key` (clean, `index.ts`
included), `deno test --no-check=remote .` (18/18 green), `pnpm --filter @helsoft/supabase-services
test` (35/35 suites green), and repo-wide `pnpm format`/`check-types`/`lint` (14/14 packages
clean, `--output-logs=errors-only`).

### 2. `[code]` Informational, not charged to this feature — duplicate `AiProvider` type declaration
`supabase/functions/generate-lesson/_shared/types.ts:10` and
`supabase/functions/generate-lesson/_shared/models.ts:10` each independently declare
`export type AiProvider = string`. This duplication pre-dates this feature (both files already
hand-mirrored the same union type before D6, per each file's own "Deno can't import the workspace
package" comment) — this diff only widened both declarations from the closed six-value union to
`string`, consistently. Not a new violation of DRY introduced by this feature; noting for
awareness only, no action requested.

### 3. `[security]` Informational, matches documented D4 — `supabase/migrations/20260726185408_ai_provider_registry.sql:28-35,57-64`
The `ai_providers_select_authenticated` / `ai_provider_models_select_authenticated` RLS policies
(`for select to authenticated using (true)`) currently have no server-side consumer — both Edge
Functions read the catalog through the service-role client (D4), and no `libs/`/app code reads
these tables directly yet (that's the paired frontend story's scope, per spec.md's Out-of-scope
list). This is exactly what D4/risks.md R5 already documents and defers to task-12's manual
verification — not a new gap now that all three slices have landed. Confirmed least-privilege:
`anon` gets no grant and no policy on either table (verified `revoke all ... from anon,
authenticated` precedes the `grant select ... to authenticated`), so an anonymous read genuinely
returns nothing (@s7). No OWASP-relevant exposure — flagging only so `dod_validator` doesn't
re-discover this as new.

## Verified clean (no findings)

- **Fail-closed correctness (D6, Slice-2's Major finding)**: `supabase/functions/_shared/provider-catalog.ts:78-88` — `loadProviderCatalog` now does `if (error) throw error;` before the `data ? … : null` return, matching the sibling `if (error) throw error;` convention at every other RPC call site in both functions. Verified solid, not re-broken: both fail-closed loci re-tested against the *real* postgrest resolved-error shape (`{ data: null, error }`, not a rejected promise) in `libs/supabase-services/src/services/provider-catalog.test.ts` ("throws when the query resolves with an error"), `lesson-generation.key-routing.integration.test.ts` ("propagates a real resolved-error catalog read"), and `supabase/functions/manage-api-key/provider.test.ts` ("throws on a real resolved-error catalog read") — three independent harnesses (Jest for the libs-facing import path, Deno for manage-api-key's own), not one test copy-pasted.
- **Rejection matrix (D10-D14) consistency across the whole diff**: `manage-api-key/provider.ts:23-37` (`guardSaveProvider`/`guardRemoveProvider`) and `generate-lesson/_shared/lesson-generation.validation.ts:22-36` (`validateByokGenerationRequest`) agree exactly with `gherkin-scenarios.md` @s17/@s20-@s26 and `_shared/types.ts:99-105`'s `provider_disabled` addition at 422 (BYOK) vs. the platform route's `platform_key_unavailable` 503 (`lesson-generation.route.ts:64-69`, D14, correctly *not* reusing `provider_disabled`) vs. `manage-api-key/index.ts`'s wire-local `{ code: 'network_error' | 'provider_disabled' }` (D11, correctly not touching `@helsoft/types`' `ApiKeyErrorCode`). Save-disabled → 400 `provider_disabled` (no Vault write); remove-disabled → 200 allowed; unknown → `network_error`/`invalid_model` byte-identical to pre-feature behaviour (D12) — all four confirmed via `provider.test.ts`'s s22-s25 cases and the integration suite's s16-s21 cases.
- **Migrations (RLS/grants/FK)**: `20260726185408_ai_provider_registry.sql` and `20260726185414_user_ai_keys_provider_fk.sql` — partial unique index correctly enforces "at most one vision-default per provider" (@s2); `check (not is_vision_default or vision)` correctly enforces vision-implies-capable (@s3); `ai_provider_models` FK `on delete cascade` correctly removes model rows with their provider (@s4); `user_ai_keys_provider_fkey` FK (explicit `on delete restrict`, the Slice-1 comment-accuracy fix) correctly blocks deleting a provider with saved keys (@s9) while still enforcing referential integrity against unknown provider ids (@s8); seed data matches @s5's table exactly (cross-checked row for row, both tables, including `sort_order`). Migration ordering (`...185408` before `...185414`) satisfies D3.
- **Cross-layer wiring (@s27/@s28)**: `provider-catalog.integration.test.ts` exercises the real `loadProviderCatalog` → real `isValidModelForProvider`/`resolveVisionModelForPlacement` → real `handleLessonGenerationRoute`, not a re-implementation (imports verified to resolve to production modules, not local stand-ins). The @s28 no-cache proof reuses one client/closure across two calls and only mutates the mocked row — genuinely would fail if a future cache were added to `loadProviderCatalog`, and `readUserApiKey` call-count (once, not twice) is asserted as an observable route-decision consequence rather than an internal call-order assertion.
- **TDD/coverage across the full diff**: every `@s` scenario maps to ≥1 concrete test per `tdd.md`'s table; s1-s9 are SQL-review/task-12-checklist only (explicit, spec-sanctioned exemption — no Jest/Deno harness exists for schema-level DDL in this repo), s10-s28 all Jest/Deno-tested. No dead or contradicted test surface found across slices: the widened `lesson-generation.validation.test.ts`/`lesson-generation.vision-model.test.ts` fully replaced their pre-catalog fixtures (no orphaned `AI_MODEL_REGISTRY`-shaped test left behind — confirmed via grep, zero remaining references anywhere under `supabase/`/`libs/supabase-services`); the two failure-shape tests that appear in both `provider-catalog.test.ts` (Jest) and `provider.test.ts` (Deno) are not wasteful duplication — they independently verify the same shared module from its two separate runtime import graphs (Jest-only `libs/supabase-services` consumers vs. Deno-only `manage-api-key`), neither of which can stand in for the other's harness.
- **Architecture/layering**: no cross-layer leak — `lesson-generation.validation.ts`/`lesson-generation.vision-model.ts` stay pure (no Supabase import), only `index.ts` in each function touches `adminClient`; `provider-catalog.types.ts` correctly extracted per `types.mdc` (Slice-1's fix held, re-verified not re-inlined); no new `libs/` production code (only two Jest test files touched in `libs/supabase-services`, confirmed via `--stat`), so no business logic leaked into `apps/*`; no new dependencies added (`package.json`/`deno.json` diffs empty).
- **Security (OWASP)**: `authenticateCaller` derives `userId` from the caller's own JWT via the anon-key client, never trusted from the request body (A01 mitigated); all provider/model ids flow through parameterized `supabase-js` query builder calls (`.eq(...)`, `.rpc(...)` with named params), no string-concatenated SQL anywhere in the diff (A03 mitigated); `logger.ts`'s `ApiKeyLogEvent` type (unchanged by this diff) structurally excludes the raw key/body from ever reaching a log call, and the top-level catch in `manage-api-key/index.ts:204` logs only `{ action, outcome: 'network_error', userId: 'unknown' }` — no PII, no secret. No secrets/keys hardcoded anywhere in the diff (env-only, `Deno.env.get(...)`).
- **Performance**: single scoped `.eq(...).maybeSingle()` query per request (D8/D9 — no N+1, no cross-invocation cache by design, negligible cost beside the Vault/LLM round trips it's threaded alongside). No UI/component changes in this diff (backend-only feature) — no render-path or list-virtualization surface to assess.

## Not re-litigated (already resolved per spec.md/review-slice.md)
D4 (service-role read), D6 (fail-closed genuinely fixed and re-verified above), D7 (no SDK-capability guard, accepted risk), D9 (no cache, @s28-tested), D10 (save/remove asymmetry), D14 (platform route keeps `platform_key_unavailable`) — all confirmed still holding across the full diff, not restated as new findings.

## Round 2 (fix-only re-review, commit `83c0504c3`, CI green @ `83c0504c3`)

**CI (re-run once by `reviews_lead`, not by me): green @ `83c0504c3`** — `pnpm lint` 14/14, `pnpm
check-types` 14/14, `pnpm --filter @helsoft/supabase-services test` 35/35 suites / 290/290 tests,
`deno test --no-check=remote .` in `manage-api-key` 18/18, `deno check *.ts` in `manage-api-key`
clean.

**Scope check (own verification, not taken on trust)**: `git log --oneline f3eb14a8c..HEAD` shows
exactly two commits since the round-1-reviewed sha: `4588fbd43` (docs-only, round-1 review
write-up) and `83c0504c3` (the fix). `git diff --stat f3eb14a8c..HEAD` confirms the only
non-docs file touched is `supabase/functions/manage-api-key/index.ts` (+13/-12); `tasks.md` is a
one-line docs edit. So round 1's "verified clean" sections (fail-closed correctness, rejection
matrix, migrations, cross-layer wiring, TDD coverage, architecture/layering, the rest of
security/performance) had zero code to re-drift against — re-confirmed by direct re-read of
`_shared/provider-catalog.ts` (fail-closed `if (error) throw error;` before the `data ? … : null`
return, byte-identical to round 1) and the migration's `revoke all … from anon, authenticated` /
`grant select … to authenticated` / `grant all … to service_role` triad on both
`ai_providers`/`ai_provider_models` (byte-identical to round 1), rather than re-derived from
nothing.

### Finding #1 — `[arch]` Minor — RE-VERIFIED RESOLVED

Read the full current `supabase/functions/manage-api-key/index.ts` (210 lines) and the exact
`git diff f3eb14a8c..HEAD -- supabase/functions/manage-api-key/index.ts` produced by the fix
commit, not just the implementer's changelog note. Confirmed directly, not on the strength of the
prior "Resolved" note alone:

- `import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';` (line 7) —
  the real type is now imported, not synthesized.
- `listUserApiKeys` (line 66-69) declares `adminClient: SupabaseClient` — the real type, not
  `AnySupabaseClient`.
- `dispatch` (line 116-120) declares `adminClient: SupabaseClient` — same.
- `AnySupabaseClient`/`any` (lines 25-26) is now used **only** as an inline
  `adminClient as AnySupabaseClient` cast at the two `loadProviderCatalog(...)` call sites: line
  126 (remove branch) and line 154 (save branch). Grepped the whole file for `AnySupabaseClient`
  and `: any` — no third occurrence anywhere.
- Every other `adminClient` use in the file is confirmed back under real `SupabaseClient` type
  checking, un-widened: `.from('user_ai_keys').select('provider, updated_at').eq('user_id',
  userId)` (lines 70-73), `.rpc('remove_api_key', { p_user_id, p_provider })` (lines 135-138),
  `.rpc('save_api_key', { p_user_id, p_provider, p_api_key })` (lines 164-168).
- No regression introduced by the fix commit itself: the diff touches only the import line, the
  block comment above `AnySupabaseClient`, the two function signatures, and the two call sites —
  no logic, no control flow, no error handling changed. `errorStatus`, `authenticateCaller`, the
  `Deno.serve` handler's try/catch/fail-closed-502 path, and `logEvent`'s redacted-log call are
  byte-identical to round 1.

**Verdict on finding #1: genuinely fixed.** Marking `resolved` (upgraded from round 1's
implementer-claimed "Resolved" to reviewer-verified).

### Fresh full-diff pass (all four lenses)

- **Code quality/TDD**: no new production `.ts` code beyond the two-line signature change + two
  inline casts (test-first non-UI discipline not re-triggered — this is a type-annotation-only
  fix, no new behavior, no new test surface required or added; CI's unchanged 18/18 Deno + 35/35
  Jest counts confirm no behavior moved). No `console.log`/debug leftovers introduced. No new
  magic numbers, no duplication.
- **Architecture/layering**: fix is entirely internal to one Edge Function's file-local type
  annotations; no cross-layer import changed, no DTO shape changed, no new dependency.
- **Performance**: N/A change surface (type-only fix, zero runtime behavior difference — same
  query, same RPC calls, same call count). Round 1's "single scoped query per request" finding
  still holds, unaffected.
- **Security (OWASP)**: no new attack surface. If anything, this fix *improves* the security
  posture marginally versus round 1 by restoring compile-time type safety on the two `.rpc(...)`
  calls (`save_api_key`/`remove_api_key`) and the `user_ai_keys` select — round 1 already judged
  the pre-fix state "not a security leak," and the fix removes even that residual risk by
  re-narrowing the type surface. No secrets, no PII, no new trust-boundary crossing.

**Zero new findings.** No blocker, major, or minor beyond the now-resolved finding #1. The two
round-1 informational items (duplicate `AiProvider` type declaration; D4's unconsumed
`authenticated`-role RLS policy pending the frontend story) are unchanged, still informational,
still not new gaps — re-confirmed by direct grep/read this round, not restated as new findings.

## Round 2 verdict: APPROVED

Zero open findings of any severity. Finding #1 is resolved and reviewer-verified (not
implementer-claim-only). Fresh full-diff pass found nothing new.
