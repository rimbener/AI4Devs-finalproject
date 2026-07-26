---
feature: ai-provider-registry-backend
slice: 1 (schema, seed, catalog read, BYOK happy path) — tasks 1-6
---

# TDD log — Slice 1

## Limitation (explicit)
No live Supabase project in this sandbox — `task-1`/`task-2` migrations (SQL only, no Jest
harness exists for SQL per risks.md R1) are verified by **SQL review against Done criteria**,
not by `supabase db push` or a Jest test. `@s1-@s9` will be proven for real by `task-12`'s SQL
verification script against a live project. `supabase/functions/generate-lesson/index.ts` is
Deno-only (outside the Jest/tsc graph, per existing repo convention for this file) — wired by
hand, flagged for manual verification after a real `supabase functions deploy` (never run from
this pipeline).

## `@s` → test map (Slice 1)
| `@s` | Behaviour | Test |
|---|---|---|
| s1-s7 | catalog tables, constraints, RLS, grants, seed | SQL review only (task-12 script) |
| s8-s9 | FK RESTRICT on `user_ai_keys.provider` | SQL review only (task-12 script) |
| s10 | read one provider + models in catalog order | `provider-catalog.test.ts` |
| s11 | unknown provider → `null` | `provider-catalog.test.ts` |
| s12 | model belonging to provider accepted; key resolves | `lesson-generation.validation.test.ts` |
| s19 | model absent from provider's models rejected | `lesson-generation.validation.test.ts` |
| s13 | vision-capable selected model used directly | `lesson-generation.vision-model.test.ts` |
| s14 | non-vision selected model falls back to vision default | `lesson-generation.vision-model.test.ts` |
| s15 | no vision default degrades to text-only (`null`) | `lesson-generation.vision-model.test.ts` |
| s16 | catalog entry loaded once; BYOK generation proceeds | `lesson-generation.key-routing.integration.test.ts` |

## Cycles

**task-1/task-2 (migrations, no Jest harness):**
- Wrote `20260726185408_ai_provider_registry.sql` (both tables, PK, FK cascade, vision-default
  CHECK + partial unique index, RLS `select to authenticated`, revoke/grant trio, seed matching
  `@s5`'s table exactly) mirroring `20260716170000_create_profiles.sql`'s shape.
- Wrote `20260726185414_user_ai_keys_provider_fk.sql` (drop CHECK, add RESTRICT FK), timestamp
  after task-1's. Both carry a reversibility-note header per repo convention.

**task-3 — `provider-catalog.ts` (RED→GREEN per `@s`):**
- RED: `provider-catalog.test.ts` importing non-existent `loadProviderCatalog` → compile fail.
- GREEN: added `ProviderEntry`/`ProviderModel` types (import-free pure half) + `loadProviderCatalog`
  (impure half, one `.maybeSingle()` query, models mapped + sorted by `sort_order`).
- s11 passed on the same implementation with no extra code (the `data ? … : null` ternary
  written for s10 already covers the "no row" case) — noted, not re-derived.

**task-4 — delete hardcoded registries, widen `AiProvider`, entry-based model validation:**
- RED: rewrote `lesson-generation.validation.test.ts` against `ProviderEntry` fixtures (entry
  param instead of a bare `provider` string) → compile fail (`entry` unknown prop).
- GREEN: deleted `AI_PROVIDERS`/`AI_MODEL_REGISTRY` from `models.ts`; widened `AiProvider` to
  `string` in `models.ts` + `_shared/types.ts`; rewrote `isValidModelForProvider` /
  `validateByokGenerationRequest` / `resolveByokGenerationKey` to take a `ProviderEntry | null`
  and decide from its `models` array — `isAiProvider`'s hardcoded allow-list check is gone
  entirely (unknown-provider handling is now "loader returned null", task-8's territory).
- All 8 rewritten cases green; no fallback list remains.

**task-5 — vision resolution from the injected entry:**
- RED: rewrote `lesson-generation.vision-model.test.ts` around `ProviderEntry` fixtures →
  compile fail (`ProviderEntry` not assignable to old `string` provider param).
- GREEN: collapsed `resolveVisionModelFromRegistry` + `resolveVisionModelForPlacement` into one
  `resolveVisionModelForPlacement(entry, selectedModelId)`: selected-if-vision → entry's
  `isVisionDefault` model → `null`. All 4 cases (incl. `null` entry) green.

**task-6 — thread the loaded entry through `route.ts` + `index.ts`:**
- RED: added an s16 test to `lesson-generation.key-routing.integration.test.ts` asserting
  `loadProviderEntry` is called once with the provider id and BYOK resolves on the returned
  entry → compile fail (`loadProviderEntry` unknown prop on `HandleLessonGenerationRouteInput`).
- GREEN: added optional `loadProviderEntry` dependency to `handleLessonGenerationRoute`; BYOK
  branch loads the entry once (string-typed provider only) and threads it into
  `resolveByokGenerationKey`. Wired `index.ts` to supply it via `loadProviderCatalog(adminClient,
  providerId)` (the existing service-role client, no new client — D4), caching the loaded entry
  in a request-scoped `let` and reusing it (never re-reading) for vision-model resolution
  (`runVisionPlacement` now takes the entry). Platform path (still hardcoded to `groq`) loads
  groq's entry separately once, immediately after `resolvedKey` resolves, preserving its existing
  vision-placement behaviour — `enabled` enforcement on that path is task-7's job, not this one's.
- Regression fix: 4 pre-existing BYOK-success cases in the integration test predate the catalog
  and had no `loadProviderEntry` mock — added `groqEntry`/`openaiEntry`/`anthropicEntry`
  fixtures and wired the mock into each so they keep passing under the new entry-required gate.

## Slice gate
- `pnpm --filter @helsoft/supabase-services test` — 34 suites / 281 tests green.
- `pnpm --filter @helsoft/supabase-services check-types` — clean.
- `pnpm check-types` (repo-wide, `--output-logs=errors-only`) — 14/14 packages clean.
- `pnpm format` — 2 files reformatted (test fixtures), no logic change; re-ran tests after, green.
- `pnpm lint` (repo-wide, `--output-logs=errors-only`) — 14/14 packages clean.
- `manage-api-key/`, `libs/types/` untouched (D15/slice-2 scope), confirmed via `git status`.
