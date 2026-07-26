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

## `@s` → test map (Slice 1, condensed)
| `@s` | Test |
|---|---|
| s1-s9 | SQL review only (task-12 script) |
| s10-s11 | `provider-catalog.test.ts` |
| s12/s19 | `lesson-generation.validation.test.ts` |
| s13-s15 | `lesson-generation.vision-model.test.ts` |
| s16 | `lesson-generation.key-routing.integration.test.ts` |

## Cycles (Slice 1, one line each)
- task-1/2: migrations (SQL review, no Jest harness).
- task-3: RED missing `loadProviderCatalog` → GREEN `ProviderEntry`/loader (s10/s11).
- task-4: RED `ProviderEntry`-shaped validation fixtures → GREEN deleted hardcoded registries,
  widened `AiProvider` to `string`, entry-based `isValidModelForProvider`.
- task-5: RED `ProviderEntry` vision fixtures → GREEN collapsed to one
  `resolveVisionModelForPlacement(entry, model)`.
- task-6: RED s16 `loadProviderEntry`-once assertion → GREEN threaded entry through
  route.ts/index.ts, request-scoped, never re-read (D9).
- Review round 1 (3 findings, all resolved): extracted `provider-catalog.types.ts`; deleted dead
  `AiModelEntry`/`AiProviderModels`; added explicit FK `on delete restrict`.

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
- RED: `lesson-generation.validation.test.ts` — disabled `ProviderEntry` expected
  `provider_disabled` from `validateByokGenerationRequest`/`resolveByokGenerationKey` (readUserApiKey
  un-called) → failed against old 2-branch logic.
- GREEN: `validateByokGenerationRequest` now checks `!entry` (→ `invalid_model`) before
  `!entry.enabled` (→ `provider_disabled`) before model membership; widened both result unions.
  Widened Edge-mirror `GenerationErrorCode` (`_shared/types.ts`) with `'provider_disabled'`
  (D13, mirror only — `libs/types` untouched); `index.ts`'s status ladder maps it to 422 explicitly.
- RED: new `key-routing.integration.test.ts` case — disabled groq entry via `loadProviderEntry`
  on the platform branch expected `platform_key_unavailable` with `acquirePlatformSlot` uncalled →
  failed (route resolved `ok: true`).
- GREEN: `route.ts`'s platform branch now calls `loadProviderEntry?.('groq')` and rejects before
  `resolveLessonGenerationKeyForPlan`/slot acquisition when disabled; omitted `loadProviderEntry`
  (older call sites) is a no-op, not a rejection — zero regression on the 9 pre-existing platform
  cases. `index.ts` simplified: the old post-hoc `providerEntry` platform fallback load is now dead
  (route.ts's own call already populates it via the shared closure) — removed, not duplicated (D9).

**task-8 (@s18/@s21) — pin unknown + fail-closed, no new branch:**
- s18 already green from Slice 1 (`entry === null` → `invalid_model`); added no code, only the
  disabled-fixture tests above coexist with it unchanged.
- RED→GREEN-with-no-code: added an integration-test case with a rejecting `loadProviderEntry` mock,
  asserting `handleLessonGenerationRoute` rejects (propagates) and `readUserApiKey` is never
  called — passed immediately (route.ts has no local try/catch around the loader call), proving
  `index.ts`'s existing `catch { generation_failed 500 }` is the whole fail-closed path.

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
- RED→GREEN-with-no-code: added a Deno test constructing a fake catalog client whose
  `.maybeSingle()` rejects, asserting `loadProviderCatalog` propagates rather than swallowing —
  passed immediately, proving `dispatch`'s uncaught `await loadProviderCatalog(...)` reaches
  `index.ts`'s existing `catch { logEvent(redacted); 502 network_error }` unchanged.

## Slice gate
- `pnpm --filter @helsoft/supabase-services test` — 34 suites / 286 tests green.
- `deno test --no-check=remote .` (manage-api-key) — 17/17 green; `deno check index.ts` clean.
- `pnpm --filter @helsoft/supabase-services check-types` + repo-wide `pnpm check-types`
  (`--output-logs=errors-only`, 14/14 packages) — clean.
- `pnpm format` — 1 whitespace fix, no logic change; re-ran tests after, green.
- `pnpm lint` (repo-wide, `--output-logs=errors-only`) — 14/14 packages clean (`supabase/functions`
  is Biome-ignored repo-wide, unchanged from Slice 1).
- `libs/` untouched by tasks 7-10 (confirmed via `git status`) — D11/D13/D15 scope boundaries held.
