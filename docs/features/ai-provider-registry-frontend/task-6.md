---
id: task-6
title: Show a non-color-only "Disabled" indicator on a saved, now-disabled provider
slice: 2
scenarios: [s5, s6, s22]
status: todo
paths:
  - libs/components/src/molecules/api-key-saved-list/api-key-saved-list.tsx
  - libs/components/src/molecules/api-key-saved-list/api-key-saved-list.types.ts
  - libs/components/src/molecules/api-key-saved-list/api-key-saved-list.test.tsx
  - libs/components/src/organisms/api-key-manager/api-key-manager.types.ts
  - libs/study-buddy/src/components/api-key-settings-screen/api-key-settings-screen.tsx
  - libs/localization/src/resources/en.ts
  - libs/localization/src/resources/es.ts
  - libs/localization/src/resources/pt.ts
  - libs/localization/src/resources/de.ts
---

## Goal
A saved provider whose catalog row is `enabled: false` stays in the saved-keys list (never
auto-removed) and shows a "Disabled" indicator that doesn't depend on color alone.

## Done criteria
- [ ] Scenario s5 covered: a saved, disabled provider still renders as a row in
      `ApiKeySavedList`, with a visible "Disabled" label/badge next to its saved-status text
- [ ] Scenario s6 covered: the row's `SavedProviderKey` is untouched — no client-side filtering
      removes a disabled provider's key from `savedKeys`/`ApiKeyManager`'s rendering
- [ ] Scenario s22 covered: the indicator carries its own text (e.g. `t('settings.apiKey.manager.
      disabled')`), exposed to assistive tech via the row's accessible name/description — not a
      color swatch or icon alone (WCAG 1.4.1)
- [ ] `ApiKeySavedListProps` gains a way to know a row's `enabled` flag (e.g. a `catalogByProvider:
      Partial<Record<AiProvider, AiProviderCatalogEntry>>` prop, or an `enabledProviders: Set
      <AiProvider>` — implementer's call) built by `ApiKeySettingsScreen` from `useAiProviders()`
- [ ] New locale key (e.g. `settings.apiKey.manager.disabled: 'Disabled'`) added, translated, to all
      four bundles in the same commit (`migration-coverage.test.ts`'s existing key-parity guard must
      stay green)
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green for `@helsoft/components` and
      `@helsoft/study-buddy`

## Notes
- Decision 5. The Replace/Remove buttons on a disabled row are **not** disabled by this task — a
  disabled provider's Replace action is meaningless (task-7 excludes it from ever becoming the
  *add*-picker's choice, but Replace on an already-saved row is a UX question outside this story's
  ACs) — leave Replace enabled unless task-7's implementation finds it needs gating; Remove must stay
  enabled (scenario s7, task-7).
- Today's seed has zero disabled providers — this task's tests must construct their own
  fixture/mock with one disabled row rather than relying on the shared parity fixture (task-5),
  which is deliberately all-enabled.
