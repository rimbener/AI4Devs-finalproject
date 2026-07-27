---
id: task-3
title: Migrate the settings screen + saved-keys list + add-key dialog onto the live catalog
slice: 1
scenarios: [s1, s2, s3, s11]
status: done
paths:
  - libs/study-buddy/src/components/api-key-settings-screen/api-key-settings-screen.tsx
  - libs/study-buddy/src/components/api-key-settings-screen/api-key-settings-screen.test.tsx
  - libs/components/src/organisms/api-key-manager/api-key-manager.types.ts
  - libs/components/src/organisms/api-key-manager/use-api-key-manager.ts
  - libs/components/src/organisms/api-key-manager/use-api-key-manager.test.ts
  - libs/components/src/organisms/api-key-form-dialog/api-key-form-dialog.types.ts
  - libs/components/src/molecules/api-key-saved-list/api-key-saved-list.types.ts
  - libs/components/src/molecules/api-key-saved-list/api-key-saved-list.tsx
  - libs/components/src/molecules/api-key-saved-list/api-key-saved-list.test.tsx
---

## Goal
Replace `PROVIDER_NAME_KEYS`/`API_KEY_SETTINGS_GUIDANCE_URLS`/`AI_PROVIDERS` in the settings screen,
`ApiKeyManager`'s add/replace picker, and the saved-keys list with the live catalog's names,
guidance links, and order — no disabled-provider handling yet (today's seed has none disabled, so
this is a pure, regression-safe swap).

## Done criteria
- [ ] Scenarios s1, s2, s3 covered by component/screen tests: a provider's name/guidance/position
      shown reflects a mocked catalog entry, not a hardcoded constant — for s3 ("everywhere they're
      listed"), this task's tests cover the settings list and the add-key picker; task-4 separately
      re-exercises the same order property for the generate-flow provider picker in its own tests
      without re-claiming this tag (this task is s3's sole owner per its `scenarios:` frontmatter)
- [ ] Scenario s11 covered: the screen withholds rendering the picker/list (keeps today's loading
      state) while `useAiProviders().isLoading` is true
- [ ] `ApiKeySettingsScreen` calls `useAiProviders()` alongside its existing `useApiKey()` and builds
      `providerNameKeys`/`guidanceUrls`-shaped props from the catalog entries (or the props' types
      change to accept the ordered `AiProviderCatalogEntry[]` directly — implementer's call, but
      whichever is chosen, `ApiKeyManager`/`ApiKeySavedList`/`ApiKeyFormDialog` stay presentational
      per Decision 12, receiving data, never calling a hook themselves)
- [ ] `useApiKeyManager`'s `unsavedProviders`/`ApiKeySavedList`'s row order iterate the catalog's
      order, not `AI_PROVIDERS`
- [ ] No visual regression against today's six providers (spot-checked here; task-5 owns the pinned
      fixture proof)
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green for `@helsoft/study-buddy` and
      `@helsoft/components`

## Notes
- Decisions 1, 3, 4, 11, 12. `AI_PROVIDERS`/`PROVIDER_NAME_KEYS`/`API_KEY_SETTINGS_GUIDANCE_URLS`
  themselves are **not deleted yet** — task-11 removes them once every consumer (including the
  generate flow, task-4) has migrated, so nothing is left half-wired mid-slice.
- Disabled-provider exclusion from the add-key picker and the "Disabled" badge on saved rows are
  task-6/task-7's job, not this task's — this task only wires the *identity and order* through.
