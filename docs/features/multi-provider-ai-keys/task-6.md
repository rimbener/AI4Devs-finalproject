---
id: task-6
title: ApiKeyManager + form dialog + settings screen + i18n
slice: 1
scenarios: [s1, s2, s3, s6, s7, s8, s9]
status: done
paths: [libs/components/src/organisms/api-key-manager/, libs/components/src/organisms/api-key-form/, libs/components/src/organisms/api-key-form-dialog/, libs/components/src/molecules/api-key-saved-list/, libs/study-buddy/src/components/api-key-settings/, libs/study-buddy/src/components/api-key-settings-screen/, apps/app-study-buddy/src/app/(app)/(tabs)/settings/, libs/localization/src/resources/]
---

## Goal
Build the multi-provider settings UI. Nested routes: Settings tab → `ApiKeySettings` entry → `/settings/api-keys` → `ApiKeySettingsScreen` → `ApiKeyManager`.

Composition:
- **`ApiKeyManager`** (organism) — loading/empty/list/error; wires `useApiKeyManager` (`useReducer`); remove confirm `Dialog`; Add (hidden at 6/6).
- **`ApiKeySavedList`** (molecule) — registry-order rows from `savedProviders` + `savedKeys` (name + “saved · updated {date}” + Replace/Remove).
- **`ApiKeyFormDialog`** (organism) — add|replace modal; unsaved-only provider `RadioGroup` (add) + `ApiKeyForm` (secure field, Save, guidance link).
- **`ApiKeyForm`** (organism) — key field + save + optional guidance (used inside dialog for both modes).

Props-driven. Wire screens via `useApiKey()`, gated by `profile.showKeySettings`. i18n: providers + manager/add/empty/entry + shared `error.network` (en/es/de/pt).

## Done criteria
- [ ] Scenario(s) s1, s2, s3, s6, s7, s8, s9 covered by concrete component test(s) + Storybook + Playwright e2e (per storybook-e2e-tests skill)
- [ ] Configured rows, Add modal (unsaved-only picker), all 4 UI states; Add hidden when all six saved
- [ ] Raw key never rendered after save; guidance link per picked provider
- [ ] i18n keys added to every locale (en/es/de/pt); no hardcoded strings/colors/dimensions
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Reuse `RadioGroup`, `Dialog`, `TextField`, `Button`, `ProgressIndicator`. Follow atomic-design + component-split; local modal state ≥3 fields → reducer. Fixed order groq→openai→anthropic→google→xai→deepseek. Provider name keys + guidance URLs from `@helsoft/types`. Lesson recovery CTA → `/settings/api-keys`.
