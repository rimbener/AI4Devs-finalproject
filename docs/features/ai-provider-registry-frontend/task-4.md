---
id: task-4
title: Migrate the generate-flow provider/model pickers onto the live catalog
slice: 1
scenarios: [s4, s10]
status: todo
paths:
  - libs/study-buddy/src/components/lesson-generation/use-lesson-generation.ts
  - libs/study-buddy/src/components/lesson-generation/use-lesson-generation.test.ts
  - libs/study-buddy/src/components/lesson-generation/lesson-generation.helpers.ts
  - libs/study-buddy/src/components/lesson-generation/lesson-generation.helpers.test.ts
  - libs/study-buddy/src/components/lesson-generation/lesson-generation.tsx
  - libs/components/src/organisms/lesson-generation-panel/components/provider-selector.tsx
  - libs/components/src/organisms/lesson-generation-panel/components/provider-selector.test.tsx
  - libs/components/src/organisms/lesson-generation-panel/components/model-selector.tsx
  - libs/components/src/organisms/lesson-generation-panel/components/model-selector.test.tsx
  - libs/components/src/organisms/lesson-generation-panel/lesson-generation-panel.types.ts
---

## Goal
Replace `AI_MODEL_REGISTRY`/`AI_PROVIDERS` in `useLessonGenerationForm`, `lesson-generation.helpers`
(`isCuratedModel`, `resolveGenerationSelection`) and the `ProviderSelector`/`ModelSelector` chrome
with the live catalog's provider list and per-provider model list/order — no disabled-provider
exclusion yet (task-7 owns that).

## Done criteria
- [ ] `savedProviders` (the provider radio options) iterate the catalog's order, not `AI_PROVIDERS` —
      re-exercises s3 (owned by task-3) for the generate-flow surface; this task does not re-claim
      that tag
- [ ] Scenario s4 covered: `modelOptions` for a selected provider iterate that provider's catalog
      `models`, in `sortOrder`, not `AI_MODEL_REGISTRY[provider].models`
- [ ] Scenario s10 covered: a model added to (or removed from) a mocked provider's catalog entry
      appears (or disappears) from `modelOptions` with no other change
- [ ] `isCuratedModel(entry, modelId)` re-implemented against `entry.models` (the catalog entry for
      the selected provider), replacing the `AI_MODEL_REGISTRY[provider]` lookup
- [ ] `isAiProvider` (`lesson-generation.helpers.ts`) re-implemented against the catalog-backed
      provider list instead of `(AI_PROVIDERS as readonly string[]).includes(value)` — `AI_PROVIDERS`
      is deleted by task-11, so this guard must not depend on it; its only caller,
      `lesson-generation.tsx` (`isAiProvider(value)` narrowing a RadioGroup's raw string value), needs
      no behavior change, only a resourced dependency
- [ ] `resolveGenerationSelection` takes the catalog-backed provider/model lists so a stored
      preference naming a since-removed model or provider still falls back correctly
- [ ] `ModelSelector` renders `model.label` directly (a plain string from the catalog) rather than
      `t(model.labelKey)` — the model's display name is no longer an i18n key (mirrors provider
      `name` staying a plain string, Decision 3's non-goal on localized names)
- [ ] `LessonGenerationPanelValue.savedProviders` becomes `{ id: AiProvider; name: string }[]` (was
      `AiProvider[]`) so `ProviderSelector` renders `provider.name` directly instead of
      `t(PROVIDER_NAME_KEYS[provider])` — same plain-string treatment as models above
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green for `@helsoft/study-buddy` and
      `@helsoft/components`

## Notes
- Decisions 1, 4, 6, 7. No vision-default logic changes here (Decision 7) — `visionDefault` has no
  client-side reader today; this task only swaps the model *list* source.
- `ProviderSelector`'s options currently come from `savedProviders` (an array of `AiProvider`, built
  in `useLessonGenerationForm` from `useApiKey().status.keys`) — this task changes what that array
  is *ordered/sourced by* (the catalog), not what it's filtered by (still "has a saved key", per
  today's behavior); task-7 adds the "and is enabled" filter on top.
- `libs/components` cannot import `@helsoft/hooks` or `@helsoft/study-buddy` — `ProviderSelector`/
  `ModelSelector` keep receiving `savedProviders`/`modelOptions`-shaped props from
  `LessonGenerationPanelContext`, unchanged in that respect (Decision 12); only what
  `useLessonGenerationForm` populates those props with changes.
