---
feature: ai-provider-registry-frontend
story: user-stories/in-progress/ai-provider-registry-frontend.md
status: spec_drafted
---

# Spec — ai-provider-registry-frontend

## Summary
Consume the `ai_providers`/`ai_provider_models` catalog (built by the paired
`ai-provider-registry-backend` story) from every client surface — settings screen, add-key picker,
generate-flow provider/model pickers, and the two Edge Functions' error contracts — replacing the
hardcoded `AI_PROVIDERS`/`AI_MODEL_REGISTRY`/`PROVIDER_NAME_KEYS`/`API_KEY_SETTINGS_GUIDANCE_URLS`
so a provider rename, reorder, re-model or retirement shows up with no app deploy.

## User stories
- As a **learner configuring AI providers and generating lessons**, I want **the provider names,
  guidance links, and model pickers I see to always reflect the live provider catalog (including a
  provider being disabled)**, so that **the app keeps working correctly when a provider's details
  change or a provider is retired, with no app update needed**.

## Acceptance criteria
→ **[`gherkin-scenarios.md`](./gherkin-scenarios.md)** — 23 `@s` scenarios, each an AC. Tasks:
[`tasks.md`](./tasks.md) → `task-1 … task-14`. Risks: `tmp/ai-provider-registry-frontend/risks.md`.

## UI states
| State | Trigger | Notes |
|---|---|---|
| Loading | `useAiProviders()`/`useApiKey()` query in flight | Settings screen and generate pickers keep today's existing loading affordance (`ApiKeyForm`'s `ProgressIndicator`, disabled pickers) until both resolve — no new loading UI is introduced. |
| Content | Catalog loaded | Provider/model lists render in `sort_order`; a disabled provider the learner has a key for shows the new "Disabled" badge in the saved-keys list; disabled providers never appear in the add-key or generate-flow pickers. |
| Error | Catalog read fails | `useAiProviders` degrades to an empty ordered list (Decision 11) — every consumer shows its existing empty/disabled affordance, not a new error banner. Save/remove/generate failures keep using each consumer's existing error-banner slot, now with `provider_disabled` copy where applicable. |
| Empty | Catalog legitimately has no rows (cannot happen with today's seed) | Same rendering as Error — no pickers shown, no crash. |

## Analytics events
None.

## Feature flags
None.

## Out of scope / non-goals
- Any in-app admin UI for editing providers/models.
- Per-locale provider names — `name`/`label` stay plain display strings (unchanged from the backend
  story's seed).
- Making the `@ai-sdk` factory wiring dynamic — a genuinely new (7th) provider id is still code + DB;
  `AiProvider` stays the closed 6-literal union.
- New client-side vision-default resolution logic — `resolveVisionModelForPlacement` is already
  backend-owned against the catalog (`ai-provider-registry-backend`); no client code reads
  `visionDefault` today (verified: zero non-type consumers), so this story is regression-only here.
  The story's vision-default AC is discharged entirely by the backend feature's own regression
  scenarios `@s13`/`@s14`/`@s15` (`docs/features/ai-provider-registry-backend/gherkin-scenarios.md`,
  owned by backend `task-5`) — no frontend `@s` scenario or task is added for it, since there is no
  client-side behavior to regress.
- A new error-banner component/slot — `provider_disabled` copy reuses each consumer's existing
  error-banner slot (`ApiKeyForm`/`ApiKeyManager`'s `errorMessage`, `LessonGenerationPanel`'s error
  state), never a new UI shell.
- Analytics events, feature flags — neither story calls for any.

## Open decisions (resolved, with rationale)
**This section is the single source of decision rationale.** `task-N.md` Notes cite these numbers
and must not restate the reasoning.

1. **New hook `useAiProviders`** (`libs/hooks/src/hooks/use-ai-providers.ts`), `useQuery`'d with
   `staleTime: Infinity`, wrapping a new `AiProvidersService`/`AiProvidersDao` in
   `@helsoft/supabase-services`. *Why:* matches the repo's required tanstack-query pattern
   (`.agents/rules/tanstack-query.mdc`); the catalog is reference data with no per-user dimension
   (mirrors `use-session`'s `staleTime: Infinity` precedent, not a polled resource) — it needs RLS's
   `to authenticated` policy satisfied, so it's gated the same way `useApiKey`/`useProfile` already are.
2. **DAO reads the whole catalog in one query**, `ai_providers` with a nested `ai_provider_models`
   select, ordered by `sort_order` at both levels. *Why:* unlike the Edge Functions' scoped
   single-provider `loadProviderCatalog` (backend D8), every client consumer here (settings list,
   add-picker, generate provider/model pickers) needs the full ordered list at once.
3. **`AiProvider` stays the existing closed 6-literal union in `libs/types/src/ai-provider.ts`,
   unchanged.** *Why:* mirrors the backend story's own D15 (it left `ai-provider.ts`/
   `api-key-settings.ts` untouched) — only the four hardcoded constants (`AI_PROVIDERS`,
   `AI_MODEL_REGISTRY`, `PROVIDER_NAME_KEYS`, `API_KEY_SETTINGS_GUIDANCE_URLS`) and the
   then-dead `aiModel.*`/`settings.apiKey.provider.*` locale keys are deleted (task-11); a truly new
   provider id is still code + DB (unchanged non-goal).
4. **Every consumer trusts the hook's already-sorted array — no client-side re-sort.** *Why:* the
   DAO's `order by sort_order` (Decision 2) is the single source of order; re-sorting downstream
   would be a second, driftable copy of the same rule.
5. **Disabled-provider visibility split** (per the story's confirmed scope): a disabled provider
   stays visible with a "Disabled" indicator in the saved-keys list *only if* the learner already
   has a key for it, and the key is never auto-deleted; it is excluded from the add-key picker and
   the generate-flow provider picker unconditionally — even for a learner who still holds a key for
   it. *Why:* "no new choice involving a disabled provider" is the story's stated rule; a saved key
   for one is existing state, not a new choice, and `remove` must stay reachable (backend D10) or the
   credential is trapped in Vault forever.
6. **Generate-flow model list + order comes from the selected provider's catalog entry**, replacing
   `AI_MODEL_REGISTRY[provider].models`. *Why:* the story requires "adding/removing a model in the
   DB is reflected without a code change."
7. **No new client-side vision-default logic.** *Why:* `resolveVisionModelForPlacement` (backend
   story) already resolves image-placement entirely server-side from the catalog; grepping every
   non-type file in `libs/`/`supabase/` for `visionDefault` today turns up zero consumers outside
   `libs/types/src/ai-provider.ts`'s own definition — this story's job is a regression check (the
   client-sent request shape is unchanged), not new logic. Coverage: backend `@s13`/`@s14`/`@s15`
   (see the non-goals section above).
8. **`ApiKeyErrorCode` widened with `provider_disabled`** (mirrors backend D11/D12, HTTP 400). *Why:*
   `api-key.service.ts`'s current blanket `catch { throw networkError() }` would otherwise swallow
   the new code before it ever reaches the UI. Implementation detail (the DAO's error re-throw, the
   service's parse helper) is task-8.md's, not restated here.
9. **`GenerationErrorCode` widened with `provider_disabled`** (mirrors backend D13, HTTP 422). *Why:*
   same rationale as Decision 8, applied to the generate-lesson error contract; recovery category is
   `'none'` since there's nothing to retry, just a different provider to pick — same family as
   `invalid_model`. Implementation detail (exact keys, helper names) is task-9.md's, not restated
   here.
10. **The platform path needs no new copy.** *Why:* backend D14 keeps the existing
    `platform_key_unavailable` (503) for a disabled platform provider; this story only needs a
    regression scenario proving that path is untouched, not new vocabulary.
11. **On a catalog read failure, `useAiProviders` degrades to an empty ordered array** rather than
    throwing (mirrors `ApiKeyService.getApiKeyStatus()`'s existing catch-to-empty precedent). *Why:*
    the server-side gate (not the client's picker) is what actually protects a disabled/unknown
    provider at save/generate time (backend D6 fail-closed); the client only needs to avoid crashing
    or showing a stale hardcoded list.
12. **Components stay presentational.** `ApiKeyManager`/`ApiKeySavedList`/`ApiKeyFormDialog`/
    `ProviderSelector`/`ModelSelector` (all in `@helsoft/components`) keep receiving the ordered
    catalog data as props built by the wiring layer — `ApiKeySettingsScreen` and
    `useLessonGenerationForm` are the only two `useAiProviders()` callers. *Why:*
    `.agents/rules/hooks-service-dao.mdc` — components never call hooks/services directly; this is
    also how `providerNameKeys`/`guidanceUrls` already flow into these same components today.
13. **No analytics, no feature flags; verification leans on a fixture-pinned regression test**
    (mirrors backend's `@s5` seed-parity table) proving the six seeded providers/13 models render
    identically to today across every migrated consumer, plus one cross-layer integration test
    proving catalog rows alone drive identity, order, and visibility end to end.
