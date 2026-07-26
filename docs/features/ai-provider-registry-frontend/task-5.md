---
id: task-5
title: Pin a fixture proving today's six providers regress zero after migration
slice: 1
scenarios: [s19]
status: todo
paths:
  - libs/hooks/src/hooks/use-ai-providers.fixture.ts
  - libs/hooks/src/hooks/use-ai-providers.test.ts
  - libs/study-buddy/src/components/api-key-settings-screen/api-key-settings-screen.test.tsx
  - libs/study-buddy/src/components/lesson-generation/use-lesson-generation.test.ts
  - libs/study-buddy/.storybook/mocks/hooks.ts
---

## Goal
Pin the exact seeded catalog values (mirroring `gherkin-scenarios.md` `@s5` of the backend feature)
as a shared test fixture, and re-assert every migrated consumer (task-3, task-4) against it — so "no
visual/behavioral regression for the six existing providers" is a concrete, re-runnable test, not an
assumption about the DB.

## Done criteria
- [ ] Scenario s19 covered by at least one test per migrated consumer, all sourced from the same
      fixture
- [ ] `libs/hooks/src/hooks/use-ai-providers.fixture.ts` exports `AI_PROVIDER_CATALOG_FIXTURE:
      AiProviderCatalogEntry[]` — the six providers / thirteen models, in canonical order, with the
      exact names/guidance URLs/labels/vision flags/vision defaults from `gherkin-scenarios.md`
      `@s5` in the backend feature's contract (`docs/features/ai-provider-registry-backend/
      gherkin-scenarios.md`)
- [ ] Settings screen test: fixture-driven render shows the same six names/guidance links as today's
      hardcoded `PROVIDER_NAME_KEYS`/`API_KEY_SETTINGS_GUIDANCE_URLS` values
- [ ] Generate-flow test: fixture-driven `modelOptions`/`savedProviders` match today's hardcoded
      `AI_MODEL_REGISTRY` order and content exactly, provider by provider
- [ ] `libs/study-buddy/.storybook/mocks/hooks.ts` mocks `useAiProviders` with the fixture, so every
      existing Storybook story for these components keeps rendering unchanged
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green for `@helsoft/hooks` and
      `@helsoft/study-buddy`

## Notes
- Decision 13. This fixture is deliberately the single source both this task and task-9/task-12/
  task-13 reuse — a second, independently-typed mock catalog would be exactly the kind of drift risk
  this task exists to prevent.
- Do not delete `libs/types/src/ai-provider.ts`'s `AI_MODEL_REGISTRY`/`AI_PROVIDERS` in this task —
  they're still the "before" values these tests diff the fixture against; task-11 removes them once
  every consumer and this fixture no longer needs the comparison.
