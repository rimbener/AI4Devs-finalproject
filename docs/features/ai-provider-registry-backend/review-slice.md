---
feature: ai-provider-registry-backend
---

# Slice review — ai-provider-registry-backend

Durable trail across slices/rounds. Findings are `open` until the cited implementer fix lands; never emptied.

## Slice 1 — round 1 (commit `28258cfe9`)

**Scope reviewed**: task-1..task-6 diff (`git diff 273b7e2d1 28258cfe9`) — two migrations
(`20260726185408_ai_provider_registry.sql`, `20260726185414_user_ai_keys_provider_fk.sql`),
`supabase/functions/_shared/provider-catalog.ts` (new), `generate-lesson/_shared/models.ts`,
`lesson-generation.validation.ts`, `lesson-generation.vision-model.ts`, `lesson-generation.route.ts`,
`lesson-generation.provider-factory.ts`, `types.ts`, `index.ts`, plus the corresponding Jest tests
in `libs/supabase-services/src/services/`.

**Verdict: CHANGES_REQUESTED** — all 3 findings RESOLVED by `implementer` in a follow-up commit
(no re-review round remains per protocol; see each finding's fix note below).

### Findings

1. **`[types]` RESOLVED — Major.** Fix: extracted `ProviderEntry`/`ProviderModel` into
   `supabase/functions/_shared/provider-catalog.types.ts` (import-free); `provider-catalog.ts` now
   imports the type from there instead of defining/exporting it, and no longer exports the private
   `CatalogQueryClient` structural type either (single-file use only, not a public contract). All
   six consumers (`lesson-generation.validation.ts`, `lesson-generation.vision-model.ts`,
   `lesson-generation.route.ts`, `index.ts`, `lesson-generation.validation.test.ts`,
   `lesson-generation.vision-model.test.ts`) re-pointed to import `ProviderEntry` from
   `provider-catalog.types.ts`. Re-ran `pnpm --filter @helsoft/supabase-services test`
   (34/34 suites, 281/281 tests), `check-types`, repo-wide `pnpm check-types`/`pnpm lint` — all
   green. Original finding, unchanged below:

   `supabase/functions/_shared/provider-catalog.ts:9-24` defines
   `ProviderEntry`/`ProviderModel` and exports them directly from the implementation file, but they
   are consumed across ≥6 other files: `lesson-generation.validation.ts:5`,
   `lesson-generation.vision-model.ts:5`, `lesson-generation.route.ts:1`, `index.ts:23`, and the
   `ProviderEntry`-importing tests `lesson-generation.validation.test.ts:1`,
   `lesson-generation.vision-model.test.ts:1`. Per `.agents/rules/types.mdc`: "If the type is used
   in multiple files, it should be stored in a `*.types.ts` file, and not exported from the
   component, class, service, hook, etc." This exact convention is already established in the very
   same directory (`generate-lesson/_shared/lesson-generation.types.ts`, whose own header even notes
   it exists because of "review.md round-1 finding #2's file split") — so this isn't a new pattern,
   it's an existing one this slice should have followed. Fix: extract `ProviderEntry`/`ProviderModel`
   into a co-located `supabase/functions/_shared/provider-catalog.types.ts` (import-free, matching
   task-3's own "pure half" framing), re-point `provider-catalog.ts` and all consumers to import the
   types from there, and stop exporting them from `provider-catalog.ts` itself.

2. **`[code-quality]` RESOLVED — Minor/dead-code (YAGNI).** Fix: deleted `AiModelEntry` and
   `AiProviderModels` from `models.ts` outright (no future task-7..12 consumer named or found);
   rewrote the file header to point at `provider-catalog.types.ts`'s `ProviderModel`/`ProviderEntry`
   as the live replacement instead of the vague "older seams" wording. Also corrected task-4.md's
   Done-criteria bullet that had asserted these types must remain exported. Confirmed via grep: no
   remaining reference to either type anywhere under `supabase/` or `libs/supabase-services`
   (`libs/types/src/ai-provider.ts`'s own same-named types are untouched, unrelated, D15 scope).
   Re-ran the same green suite as finding 1. Original finding, unchanged below:

   `supabase/functions/generate-lesson/_shared/models.ts:11-18` — `AiModelEntry`/`AiProviderModels`
   are still exported (per task-4.md's Done criteria, "kept for type-shape compatibility with older
   seams") but after `AI_MODEL_REGISTRY`'s deletion in this same slice, nothing in the reachable
   import graph uses them: `index.ts`, `lesson-generation.provider-factory.ts` and
   `lesson-generation.route.ts` only import `AiProvider`/`PLATFORM_TEXT_MODEL_ID` from this file, and
   no later task (task-7 through task-12) ever touches `models.ts` again. They are permanently dead
   after this slice. Fix: delete both types (and update the file header, which still references a
   now-nonexistent "older seam"), or — if there's a real planned consumer not reflected in the task
   docs — name it explicitly in the comment instead of the vague "older seams."

3. **`[code-quality]` RESOLVED — Minor, comment accuracy.** Fix: added an explicit
   `on delete restrict` clause to the `user_ai_keys_provider_fkey` FK (rather than relying on the
   unstated `NO ACTION` default) and reworded the header comment to name `NO ACTION` as the actual
   default and explain why it's behaviourally identical here (constraint isn't deferrable). Also
   corrected the equivalent claim in task-2.md's Done criteria. No live DB in this sandbox to
   re-apply the migration against; verified by SQL review only (same limitation noted in `tdd.md`).
   Original finding, unchanged below:

   `supabase/migrations/20260726185414_user_ai_keys_provider_fk.sql:8-9` (header) states
   "`ON DELETE RESTRICT` (the default)" for the new `user_ai_keys_provider_fkey`, but the DDL itself
   never writes `on delete restrict` and Postgres's actual default when no `ON DELETE` clause is
   given is `NO ACTION`, not `RESTRICT` (they differ for deferrable constraints only, which this one
   isn't, so the *behaviour* described — blocking the delete — is correct, only the name is wrong).
   Fix: either add an explicit `on delete restrict` to the `alter table` so the comment is literally
   true, or correct the comment to `NO ACTION (the default, behaviourally identical to RESTRICT here
   since the constraint isn't deferrable)`.

### Checks that passed (no findings)

- **`[hooks-service-dao]`** — N/A/pass: this is Supabase Edge Function server code
  (`supabase/functions/`), not `libs/*`; it correctly keeps the pure decision modules
  (`lesson-generation.validation.ts`, `lesson-generation.vision-model.ts`) free of any Supabase
  client import, with only `index.ts` touching `adminClient` (matching the pre-existing `plans`
  read precedent) and `provider-catalog.ts`'s `loadProviderCatalog` taking a structurally-typed
  client rather than importing `supabase-js`. No hook/service/DAO boundary is crossed by this slice.
- **`[global]`** — kebab-case filenames throughout; migrations in `supabase/migrations/`, shared Edge
  module in `supabase/functions/_shared/` (matching the `cors.ts` precedent); Deno (`.ts` with
  `npm:`/`.ts` extension imports) vs. Jest (`libs/supabase-services/src/services/*.test.ts` reaching
  into `supabase/functions/` by relative import) boundary respected, matching the established
  `lesson-generation.validation.test.ts` precedent cited in task-3's own notes. `libs/types/src/ai-provider.ts`
  confirmed untouched (`git diff` empty) — D15 respected.
- **`[tdd]`** — genuine Red→Green→Refactor evidence for all non-UI `.ts` work (task-3/4/5/6) in
  `tdd.md`, one `@s` at a time, tests rewritten against injected `ProviderEntry` fixtures rather than
  retrofitted; migrations (task-1/2) have no Jest harness in this repo (documented risk R1) and are
  explicitly deferred to task-12's SQL verification script — a pre-agreed, spec-level exemption, not
  an implementer shortcut. `tdd.md` is 5997 bytes, under the 8000-byte budget.
- **Migration correctness** — `ai_providers`/`ai_provider_models` RLS + grants match the `plans`
  precedent (`20260716170000_create_profiles.sql`) policy-name/revoke/grant shape exactly; two-file
  ordering (`...185408` before `...185414`) satisfies D3; reversibility-note headers present on both
  migrations; the `groq`-disables-platform-generation blast-radius warning (D14) is present in
  task-1's migration header as required.
- **`AiProvider` widening** — widened to `string` in both `models.ts` and `_shared/types.ts` per D6;
  `providerCreators: Record<AiProvider, ...>` in `lesson-generation.provider-factory.ts` correctly
  keeps a comment documenting the accepted D7/R4 risk (possible `undefined` factory lookup) rather
  than silently absorbing it.
- **`[atomic-design]` / `[component-split]` / `[state]` / `[state-sharing]` / `[tanstack-query]` /
  `[i18n]` / `[e2e]`** — N/A, justified: this slice touches no `.tsx`, no React component/hook, and
  no `libs/hooks`/`libs/components` code; `ai_providers.name`/`ai_provider_models.label` are seeded
  display strings in Postgres, not `t()`-rendered UI copy (task-1 notes verify all locales already
  hold byte-identical values), and no UI-facing rendering is in this story's scope (frontend story
  owns it, per spec.md's Out-of-scope list).
- **Accessibility (WCAG 2.2 AA)** — **N/A**: no UI added or touched by this slice (spec.md: "UI
  states: None — no UI in scope"; confirmed by diff — no `.tsx` file present).


## Slice 2 — round 1 (commit `5fd162f74`)

**Scope reviewed**: `git diff a6b9c3d0f 5fd162f74` (task-7..task-10) — `generate-lesson/_shared/lesson-generation.route.ts`,
`lesson-generation.validation.ts`, `_shared/types.ts`, `generate-lesson/index.ts`,
`manage-api-key/provider.ts`, `manage-api-key/index.ts`, `manage-api-key/provider.test.ts`,
`libs/supabase-services/src/services/lesson-generation.{key-routing.integration,validation}.test.ts`,
plus `tdd.md`/`task-7..10.md` doc updates.

**Verdict: CHANGES_REQUESTED** — 1 finding, RESOLVED by `implementer` in a follow-up commit (no
re-review round remains per protocol; see the finding's fix note below).

### Findings

1. **`[tdd]`/`[code-quality]` (D6/D9 fail-closed correctness) — RESOLVED — Major.** Fix:
   `loadProviderCatalog` (`supabase/functions/_shared/provider-catalog.ts`) now destructures
   `{ data, error }` and does `if (error) throw error;` before its `data ? … : null` return,
   matching the sibling `if (error) throw error;` convention. TDD'd RED→GREEN: added a failing
   Jest case (`provider-catalog.test.ts`, "throws when the query resolves with an error, instead
   of returning null") mocking `maybeSingle` as a **resolved** `{ data: null, error }` (the real
   Supabase/postgrest failure shape, not a rejected promise) — failed against the old
   data-only destructure, passed once `error` was checked. Then, per the fix note, added a
   second, additional case alongside each existing rejection-based test (kept, since a genuinely
   exceptional client rejection is still a real, if rarer, failure mode) rather than replacing it:
   - `libs/supabase-services/src/services/lesson-generation.key-routing.integration.test.ts` —
     new case "propagates a real resolved-error catalog read (not just a rejected promise)" wires
     `loadProviderEntry` to the *real* `loadProviderCatalog` against a fake client that resolves
     `{ data: null, error }`, proving `route.ts`'s propagation holds for the actual failure shape
     s21 names (not just a mocked rejection).
   - `supabase/functions/manage-api-key/provider.test.ts` — new Deno test "loadProviderCatalog
     throws on a real resolved-error catalog read (not just a rejection)", same resolved-error
     shape, proving s26's claim for real.
   Re-ran the full gate: `pnpm --filter @helsoft/supabase-services test` (34/34 suites, 288/288
   tests, +2 from this fix), `check-types`, repo-wide `check-types`/`lint` (14/14), `deno test
   --no-check=remote .` in `manage-api-key` (18/18) and `deno check` on all its files — all green.
   `libs/types`/`libs/` scope boundaries (D11/D13/D15) still held — only the pre-existing shared
   `_shared/provider-catalog.ts` and the two named test files changed. Original finding, unchanged
   below:

   `supabase/functions/_shared/provider-catalog.ts:69-75` (`loadProviderCatalog`, unchanged by
   this slice but the sole dependency this slice's new fail-closed claims rest on):
   ```ts
   const { data } = await client
     .from('ai_providers')
     .select(...)
     .eq('id', providerId)
     .maybeSingle();
   return data ? toProviderEntry(data) : null;
   ```
   This destructures only `{ data }` and silently discards `error`. `@supabase/supabase-js`'s
   query builder (`@supabase/postgrest-js@2.110.0`, `PostgrestBuilder.then()` /
   `processResponse`) **resolves** with `{ data: null, error }` on a genuine DB/network failure —
   it only **rejects** for a caller-invoked `.throwOnError()` (not used anywhere in this repo,
   confirmed via `grep -rn "throwOnError"`) or truly exceptional client bugs (aborted requests).
   So a real catalog-read failure (RLS block, connection drop, DB outage) never reaches a `throw`
   here — it resolves with `data === null`, which `loadProviderCatalog` maps to `null`,
   **indistinguishable from "provider unknown."**

   This directly contradicts this slice's own explicit, tested claims:
   - `docs/features/ai-provider-registry-backend/task-8.md` (s21) / `tdd.md` cycle log: "a
     throwing catalog read → generation refused via the existing `generation_failed` **500**
     catch-all… no fallback list" — in reality it silently degrades to `invalid_model` **422**
     (the *unknown provider* branch), the exact same status a typo'd provider id gets.
   - `docs/features/ai-provider-registry-backend/task-10.md` (s26) / `tdd.md`: "a throwing
     catalog read → the existing catch-all responds **502** `{ code: 'network_error' }`" — in
     reality `guardSaveProvider(null)`/`guardRemoveProvider(null)` fire first, returning
     **400** `{ code: 'network_error' }` from `dispatch` itself, never reaching the 502 catch-all.

   The new tests that back these claims mock the failure unrealistically:
   `supabase/functions/manage-api-key/provider.test.ts:56` (`maybeSingle: () =>
   Promise.reject(new Error('catalog read failed'))`) and
   `libs/supabase-services/src/services/lesson-generation.key-routing.integration.test.ts:358`
   (`loadProviderEntry = jest.fn().mockRejectedValue(...)`) both simulate a **rejected promise**,
   which is not how a real Supabase query failure surfaces by default — so neither test actually
   exercises the scenario it's named for ("the catalog read will fail", `gherkin-scenarios.md`
   `@s21`/`@s26`). This is exactly the "RED-with-no-code-needed" claim the task asked to verify
   by reading the surrounding code rather than taking it on faith — the code was read, and the
   claim does not hold for the real failure mode, only for the mocked one.

   Net effect isn't fail-*open* (no SDK call is made, no key is stored, no Vault read happens
   either way — the safety-critical property in D6 is preserved), but it **is** a broken,
   explicitly-documented-and-"tested" contract: a genuine backend outage is silently reported as a
   client-facing "invalid model"/"unknown provider" error instead of the intended
   `generation_failed`/`network_error` fail-closed signal, which would mask a real infra incident
   from monitoring/on-call as ordinary user error. Every other query in these two call graphs
   follows the opposite, correct convention right next to this one — e.g.
   `supabase/functions/generate-lesson/index.ts`'s `acquirePlatformSlot`/`releasePlatformSlot`
   (`if (error) throw error;`) and `manage-api-key/index.ts:136` (`if (error) throw error;` inside
   `removeApiKey`) — making `loadProviderCatalog`'s silent swallow an inconsistency with the
   codebase's own established pattern, not a deliberate design choice (no `risks.md`/`spec.md`
   note documents it as accepted).

   **Fix**: `loadProviderCatalog` should destructure `{ data, error }` and `if (error) throw
   error;` before the `data ? … : null` return, matching the sibling RPC calls' convention, so the
   catch-alls this slice's tests already assert on genuinely receive the failure. Then re-mock
   `provider.test.ts`'s s26 case and `key-routing.integration.test.ts`'s s21 case as
   `maybeSingle: () => Promise.resolve({ data: null, error: new Error(...) })` (not
   `Promise.reject`) to prove the fix against the real failure shape, or add that as a second,
   additional case alongside the existing rejection one.

### Checks that passed (no findings)

- **Wire contract (D10/D11/D12)** — verified exactly: `manage-api-key/index.ts:113-166`'s
  `dispatch` loads the catalog entry once per branch, before any RPC
  (`save_api_key`/`remove_api_key`), and `provider.ts`'s `guardSaveProvider`/`guardRemoveProvider`
  produce the full matrix precisely — save+disabled → 400 `provider_disabled` (no Vault write),
  save+unknown → 400 `network_error` (byte-identical shape/status to the pre-slice `dispatch ===
  null` path), remove+disabled → allowed 200 (`guardRemoveProvider` never inspects `enabled`),
  remove+unknown → 400 `network_error`. Confirmed via `provider.test.ts`'s s22-s25 Deno tests.
- **D13/D14 distinction** — confirmed genuinely distinguished: BYOK disabled →
  `validateByokGenerationRequest`/`resolveByokGenerationKey` (`lesson-generation.validation.ts:21-33`)
  reject as `provider_disabled` **before** `readUserApiKey` is called (asserted via
  `expect(readUserApiKey).not.toHaveBeenCalled()` in the Jest mirror); mapped to 422 in
  `generate-lesson/index.ts`'s status ladder. Platform disabled →
  `lesson-generation.route.ts:64-69`'s own `groq`-only gate rejects as `platform_key_unavailable`
  **before** `resolveLessonGenerationKeyForPlan`/`acquirePlatformSlot`, unchanged 503 mapping — a
  structurally separate branch from the BYOK gate, not an approximation. Confirmed `libs/types/src/lesson-generation.ts`
  and `libs/types/src/api-key-error.ts` untouched (`git diff a6b9c3d0f 5fd162f74 -- libs/types`
  empty) — only the Edge-side `_shared/types.ts` mirror widened, per D11/D13 scope.
- **`[types]`** — no repeat of the slice-1 finding: `ByokValidationResult`/`ByokKeyResolutionResult`
  (widened, `lesson-generation.validation.ts`) and `ProviderGuardOutcome`/`ProviderGuardErrorResult`
  (`provider.ts`/`index.ts`) are each declared and consumed within a single file (no explicit
  cross-file type import of a type used in ≥2 files left un-extracted). `ProviderGuardErrorResult`
  in `index.ts` intentionally mirrors only the wire-level `{ code }` shape of
  `ProviderGuardOutcome`'s error variants (per its own comment) rather than importing/aliasing it —
  a defensible, explicit boundary (D11: Edge-local shape, not `@helsoft/types`' `ApiKeyErrorCode`),
  not an unextracted shared type.
- **D9 (load once per request, no double-fetch)** — `generate-lesson/index.ts:232-241`: the
  removed "post-hoc platform entry reload" is genuinely dead code, not a silent regression —
  `providerEntry` is populated as a side effect of the single `loadProviderEntry` closure
  (`index.ts:239-241`) that `route.ts` already calls once per branch (named provider on BYOK, hard-coded
  `groq` on platform, `lesson-generation.route.ts:64-69`), and is read again at `index.ts:381` for
  vision-model resolution on a successful route. No second catalog read occurs on either path.
- **Order of checks in `manage-api-key`** — confirmed: the `enabled` guard
  (`index.ts:123-127` for remove, `:151-155` for save) runs immediately after `loadProviderCatalog`
  and strictly before `handleRemoveApiKey`/`handleSaveApiKey` (which issue the
  `remove_api_key`/`save_api_key` RPCs) — a disabled-provider save never touches Vault.
- **No hardcoded provider list remains** — confirmed via grep: `AI_PROVIDERS`/`isAiProvider` fully
  deleted from `manage-api-key/provider.ts`; `generate-lesson/_shared/models.ts` only retains
  `AiProvider = string`/`PLATFORM_TEXT_MODEL_ID`, no registry.
- **`libs/` scope boundary (D11/D13/D15)** — `git diff a6b9c3d0f 5fd162f74 --stat -- libs/` shows
  only the two Jest test files under `libs/supabase-services/src/services/` touched; `libs/types/`
  untouched.
- **`[hooks-service-dao]` / `[atomic-design]` / `[component-split]` / `[state]` /
  `[state-sharing]` / `[tanstack-query]` / `[i18n]` / `[e2e]` / `[global]`** — N/A, same
  justification as Slice 1: no `.tsx`, no `libs/hooks`/`libs/components` code touched (confirmed —
  diff stat above lists only `.ts` files); kebab-case filenames preserved; no new files added (all
  changes are modifications to existing files, confirmed via `git diff --diff-filter=A/D`, both
  empty); comments explain *why* (D-numbered decisions), consistent with the established verbose
  why-comment style in this same tree from Slice 1.
- **Accessibility (WCAG 2.2 AA)** — **N/A**: no UI added or touched by this slice (no `.tsx` in the
  diff; spec.md confirms no UI states owned by this backend story).

## Slice 3 — round 1 (commit `2bd27f92e`)

**Scope reviewed**: `git diff ab32b5a54 2bd27f92e` (task-11..task-12) — new
`libs/supabase-services/src/services/provider-catalog.integration.test.ts` (207 lines, 2 tests),
`tmp/ai-provider-registry-backend/verify-provider-registry.sql` (282 lines, gitignored/not
committed — reviewed on disk), `tdd.md` rewrite (slice 3 log), `task-11.md`/`task-12.md` status
flips to `done`. No production code, no migration file touched by this commit (confirmed:
`git diff ab32b5a54 2bd27f92e --stat -- supabase/migrations/` is empty).

**Verdict: APPROVED** — no findings.

### Verification detail (why this passed)

- **`[tdd]` `@s28` no-cache proof, verified line by line** —
  `provider-catalog.integration.test.ts:164-206`: `buildCatalogClient()` is called **once** per
  `it` block; the returned `client` object and the `loadProviderEntry` closure over it are reused
  unchanged across both `handleLessonGenerationRoute` calls. Only `setRow(...)` mutates the shared
  closure variable the mocked `maybeSingle` reads from (`:32-39`) — no new client, no new loader
  instance, no new mock is constructed between the two calls. This is the correct shape to catch a
  future memoisation regression: if someone added a module-level cache to `loadProviderCatalog`,
  the second call would still see the first (enabled) row and this test would fail exactly as
  task-11.md's notes demand ("Write it so it would."). The `readUserApiKey` call-count assertion
  (`:205`, called once, not twice) is an observable route-decision consequence (validation short-
  circuits before Vault read, confirmed against the real
  `resolveByokGenerationKey`/`validateByokGenerationRequest` in `lesson-generation.validation.ts`),
  not an internal-call-order assertion — satisfies task-11's Done-criteria bullet on that point.
  This is **not** two fresh-mock calls proving nothing about caching — verified this is the one
  place a subtly wrong test could look right, and it isn't wrong.
- **Genuine integration, not a re-implementation** — all four imports
  (`loadProviderCatalog`, `handleLessonGenerationRoute`, `isValidModelForProvider`,
  `resolveVisionModelForPlacement`, `:8-11`) resolve to the real production modules under
  `supabase/functions/`; read each one directly and confirmed the test's expectations
  (`invalid_model`/`provider_disabled`/vision-fallback-to-default) match their actual logic
  (`lesson-generation.validation.ts:6-34`, `lesson-generation.vision-model.ts:9-18`,
  `lesson-generation.route.ts:27-52`). Mock boundary is the `from().select().eq().maybeSingle()`
  chain (`:32-39`), identical to the established `provider-catalog.test.ts` precedent — the query
  wiring itself is exercised, not bypassed. No regex-over-source-text shortcut (pre-slice-checklist).
- **`tmp/ai-provider-registry-backend/verify-provider-registry.sql` confirmed genuinely
  uncommitted** — absent from `git show 2bd27f92e --stat`; `git check-ignore -v` confirms `tmp/`
  matches root `.gitignore:55`. Read the 282-line file directly on disk (Read tool works outside
  git). Content matches every task-12 Done-criteria bullet: §1 schema existence (s1), §2/§3
  transaction-wrapped rejection proofs for the vision-default uniqueness index and the
  vision-implies-capable check (s2/s3, each rolled back), §4 cascade-delete proof (s4), §5 a
  symmetric two-way `except` diff of live rows against the exact `gherkin-scenarios.md` `@s5`
  table (providers **and** models, `sort_order` included) — cross-checked the expected rows in
  the script against the actual seed `insert` statements in
  `supabase/migrations/20260726185408_ai_provider_registry.sql:66-91`: identical, byte for byte.
  §6/§7 `set role authenticated` / `set role anon` reads (s6/s7, never service_role, per risks.md
  R5) plus a `pg_policies` check for zero write policies. §8/§9 an `auth.users`-scoped FK proof
  (s8/s9) that skips gracefully with no test user. Deploy-ordering requirement stated explicitly
  near the top, naming both migration filenames and the fail-closed consequence (risks.md R2).
  Studio-edit runbook section is concrete (rename/disable/reorder/add-model/change-vision-default
  statements), matching task-12's Done-criteria bullet and risks.md R3/R4's assignment.
- **Task-12 verifies, does not edit, task-1/task-2's migration headers** — confirmed by re-reading
  both migration files directly: neither was touched by this commit (empty `--stat` for
  `supabase/migrations/` between `ab32b5a54` and `2bd27f92e`), and both headers do carry what the
  SQL script's tail comment claims (task-1: reversibility note + groq blast-radius warning,
  `20260726185408_ai_provider_registry.sql:9-16`; task-2: reversibility note,
  `20260726185414_user_ai_keys_provider_fk.sql:18-22`). The script's own honest note that task-1's
  header doesn't itself carry the concrete Studio-edit playbook (only names the rationale) is
  accurate — confirmed by reading the full 92-line migration file; no runbook exists elsewhere in
  it — and correctly reconciled against risks.md R3/R4's explicit assignment of that playbook to
  task-12, so this is not a gap.
- **`[types]`** — the test-local `CatalogRow` type (`:13-26`) is used only within this one file;
  correctly not extracted to a `*.types.ts` (types.mdc only requires extraction for cross-file
  use).
- **`[global]`/`[tdd]` byte budget** — `tdd.md` is 6174 bytes (< 8000-byte budget), log-only
  (no pasted test bodies/diffs), one line per cycle; `@s → test` map complete through `@s28`; all
  28 scenarios now accounted for (s1-s9 SQL-verified, s10-s28 Jest/Deno-tested).
- **No production code in this slice** — confirmed via `git diff --diff-filter=A/M -- '*.ts'
  ':(exclude)*.test.ts'` equivalent check (only the test file and doc files changed) — the Three
  Laws' RED-phase expectation doesn't apply verbatim (no new prod code to demand a test), matching
  task-11.md's own framing of this task as pure verification of already-shipped Slice 1/2 logic;
  `tdd.md` states this explicitly rather than fabricating a RED phase that didn't happen.
- **`[hooks-service-dao]` / `[atomic-design]` / `[component-split]` / `[state]` /
  `[state-sharing]` / `[tanstack-query]` / `[i18n]` / `[e2e]`** — N/A, same justification as
  Slices 1/2: no `.tsx`, no `libs/hooks`/`libs/components` code in this diff.
- **Accessibility (WCAG 2.2 AA)** — **N/A**: no UI added or touched by this slice (no `.tsx` in
  the diff).

### Carry-forward note (non-blocking, out of this slice's diff — for `reviews_lead`)

- `supabase/functions/manage-api-key/index.ts`'s locally-declared `AnySupabaseClient = any`
  (introduced in Slice 2, task-9, per `tdd.md`'s Slice-2 cycle log) is a deliberate escape hatch
  documented at the time (`SupabaseClient`'s `.maybeSingle()` return type doesn't structurally
  satisfy `loadProviderCatalog`'s minimal `CatalogQueryClient` contract) but widens an `any` at a
  boundary that otherwise fail-closes strictly. Not part of Slice 3's diff — flagging for the full
  `reviewer_engineering` pass to judge whether a narrower structural type is worth the churn now
  that all three slices have landed.
