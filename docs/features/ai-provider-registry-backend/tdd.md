---
feature: ai-provider-registry-backend
slice: 2 (enabled enforcement, rejection contracts, fail-closed) — tasks 7-10
---

# TDD log

## Limitation (explicit)
No live Supabase project in this sandbox — `task-1`/`task-2` migrations verified by SQL review,
proven for real by `task-12`'s script. Both `index.ts` files (generate-lesson, manage-api-key) are
Deno-only; `manage-api-key` has a `deno.json` so its Deno suite runs here (`deno test
--no-check=remote .`, plus `deno check`), but `generate-lesson/index.ts` has none — its wiring
stays hand-verified/manual-smoke per repo convention (unchanged from Slice 1).

## Slice 1, condensed (tasks 1-6, all green, review round 1's 3 findings resolved)
| `@s` | Test | task |
|---|---|---|
| s1-s9 | SQL review only (task-12 script) | 1/2 migrations |
| s10-s11 | `provider-catalog.test.ts` | 3: RED missing loader → GREEN `ProviderEntry`+loader |
| s12/s19 | `lesson-generation.validation.test.ts` | 4: GREEN deleted hardcoded registries, widened `AiProvider` to `string` |
| s13-s15 | `lesson-generation.vision-model.test.ts` | 5: GREEN one `resolveVisionModelForPlacement(entry, model)` |
| s16 | `lesson-generation.key-routing.integration.test.ts` | 6: GREEN entry threaded route.ts/index.ts, request-scoped (D9) |
Review round 1 fixes: extracted `provider-catalog.types.ts`; deleted dead
`AiModelEntry`/`AiProviderModels`; explicit FK `on delete restrict`.

## `@s` → test map (Slice 2)
| `@s` | Behaviour | Test |
|---|---|---|
| s17 | BYOK disabled provider → `provider_disabled`, no Vault read | `lesson-generation.validation.test.ts` |
| s18 | unknown provider stays `invalid_model` (unchanged) | pre-existing (slice 1) + integration test |
| s20 | platform provider disabled → `platform_key_unavailable`, no slot acquired | `lesson-generation.key-routing.integration.test.ts` |
| s21 | catalog throw propagates (no fallback list) | `lesson-generation.key-routing.integration.test.ts` |
| s22 | save+disabled → 400 `provider_disabled` | `provider.test.ts` (`guardSaveProvider`) |
| s23 | save+unknown → 400 `network_error` (unchanged) | `provider.test.ts` (`guardSaveProvider`) |
| s24 | remove+disabled → allowed, 200 | `provider.test.ts` (`guardRemoveProvider`) |
| s25 | remove+unknown → 400 `network_error` (unchanged) | `provider.test.ts` (`guardRemoveProvider`) |
| s26 | catalog throw propagates in manage-api-key too | `provider.test.ts` (`loadProviderCatalog` propagation) |

## Cycles (Slice 2)

**task-7 (@s17/@s20) — BYOK + platform `enabled` gate:**
- RED/GREEN #1: `lesson-generation.validation.test.ts` — disabled `ProviderEntry` expected
  `provider_disabled` (readUserApiKey un-called) → failed old 2-branch logic → GREEN:
  `validateByokGenerationRequest` checks `!entry` (`invalid_model`) then `!entry.enabled`
  (`provider_disabled`) before model membership. Widened Edge-mirror `GenerationErrorCode`
  (`_shared/types.ts`, D13, `libs/types` untouched); `index.ts` maps it to 422.
- RED/GREEN #2: new `key-routing.integration.test.ts` case — disabled groq entry via
  `loadProviderEntry` on the platform branch expected `platform_key_unavailable`,
  `acquirePlatformSlot` uncalled → failed (`ok:true`) → GREEN: `route.ts`'s platform branch calls
  `loadProviderEntry?.('groq')` and rejects before key resolution/slot acquisition when disabled;
  omitted callback is a no-op (zero regression, 9 pre-existing platform cases). `index.ts`'s old
  post-hoc platform reload removed as dead code (D9, one load per request).

**task-8 (@s18/@s21) — pin unknown + fail-closed, no new branch:**
- s18 already green from Slice 1 (`entry === null` → `invalid_model`); added no code.
- Added an integration-test case with a rejecting `loadProviderEntry` mock, asserting
  `handleLessonGenerationRoute` propagates and `readUserApiKey` is never called — passed
  immediately (route.ts has no local try/catch), proving `index.ts`'s `catch { generation_failed
  500 }` is the fail-closed path. **Superseded by the review-round-1 fix-up below**: this mock
  simulated a rejected promise, not the real Supabase failure shape.

**task-9 (@s22-@s25) — catalog-backed guard replaces the allow-list:**
- RED: rewrote `provider.test.ts` against `ProviderEntry` fixtures, importing not-yet-existing
  `guardSaveProvider`/`guardRemoveProvider` → compile fail.
- GREEN: `provider.ts` — deleted `AI_PROVIDERS`/`isAiProvider`; widened `AiProvider` to `string`;
  added the two guards (`!entry` → `network_error`; save also checks `!entry.enabled` →
  `provider_disabled`; remove never checks `enabled`). `index.ts`'s `dispatch` now loads the entry
  once via `loadProviderCatalog(adminClient, ...)` per action branch (before any RPC), calls the
  matching guard, and returns `{status:400, body:{code}}` on rejection — matrix matches D10/D12
  exactly. Fixed a real `deno check` regression from an earlier draft (splitting the action/provider
  narrowing broke discriminated-union narrowing on `body.apiKey`) by keeping the original nested/
  combined-`||` structure per branch.
- Adopted `AnySupabaseClient = any` locally (mirrors generate-lesson/index.ts's own escape hatch)
  since the real `SupabaseClient`'s `.maybeSingle()` return type doesn't structurally satisfy
  `loadProviderCatalog`'s minimal `CatalogQueryClient` contract.

**task-10 (@s26) — fail-closed, no new branch:**
- Added a Deno test with a fake catalog client whose `.maybeSingle()` rejects, asserting
  `loadProviderCatalog` propagates — passed immediately, proving `dispatch`'s uncaught
  `await loadProviderCatalog(...)` reaches `index.ts`'s `catch { 502 network_error }`.
  **Superseded by the review-round-1 fix-up below**: same rejected-promise-vs-real-shape gap.

## Slice 2 review-round-1 fix-up (commit after `5fd162f74`)
`reviewer_slice` CHANGES_REQUESTED, 1 Major finding (see `review-slice.md`), RESOLVED: real
Supabase/postgrest query failures **resolve** `{ data: null, error }` — they don't reject — so
`loadProviderCatalog` destructuring only `{ data }` silently mapped a genuine outage to "unknown
provider" instead of the s21/s26 fail-closed contract, and the RED-with-no-code tests (mocked as
rejections) never actually proved otherwise.
- RED: `provider-catalog.test.ts` new case, `maybeSingle` mocked as a **resolved**
  `{ data: null, error }` → `loadProviderCatalog` returned `null` (wrong) instead of throwing.
- GREEN: `loadProviderCatalog` now destructures `{ data, error }` and does `if (error) throw
  error;` before the `data ? … : null` return, matching the sibling `if (error) throw error;`
  convention (`acquirePlatformSlot`/`removeApiKey`).
- Added a second, additional resolved-error-shape case alongside each existing rejection case
  (kept, not replaced — a genuinely exceptional client rejection is still a real failure mode) in
  `key-routing.integration.test.ts` (wires `loadProviderEntry` to the real `loadProviderCatalog`)
  and `manage-api-key/provider.test.ts`, proving s21/s26 hold for the real failure shape.

## Slice gate
- `pnpm --filter @helsoft/supabase-services test` — 34 suites / 288 tests green.
- `deno test --no-check=remote .` (manage-api-key) — 18/18 green; `deno check` clean (all files).
- `pnpm --filter @helsoft/supabase-services check-types` + repo-wide `pnpm check-types`
  (`--output-logs=errors-only`, 14/14 packages) — clean.
- `pnpm format` clean; `pnpm lint` (repo-wide, `--output-logs=errors-only`) — 14/14 clean
  (`supabase/functions` is Biome-ignored repo-wide, unchanged from Slice 1).
- `libs/` untouched by tasks 7-10 beyond the two named test files — D11/D13/D15 scope held.
