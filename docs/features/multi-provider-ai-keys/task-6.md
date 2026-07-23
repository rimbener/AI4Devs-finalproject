---
id: task-6
title: ApiKeyManager organism + ApiKeyForm refactor + ApiKeySettings + i18n
slice: 1
scenarios: [s1, s2, s3, s6, s7, s8, s9]
status: done
paths: [libs/components/src/organisms/api-key-manager/, libs/components/src/organisms/api-key-form/, libs/study-buddy/src/components/api-key-settings/, apps/app-study-buddy/src/app/(app)/(tabs)/settings/, libs/localization/src/resources/]
---

## Goal
Build the multi-provider settings UI. Nested routes: Settings tab → `ApiKeySettings` entry button → `/settings/api-keys` screen. Presentational **`ApiKeyManager`**: masked rows (name + "saved · updated {date}" + Replace/Remove confirm `Dialog`); **Add new** opens a modal with unsaved-only provider `RadioGroup` + secure `TextField` + Save + guidance link; empty = message + Add; Add hidden at 6/6; loading spinner; error banner. Props-driven only. `ApiKeyForm` = replace sub-form. Wire `ApiKeySettings` / `ApiKeySettingsScreen` to `useApiKey()`, gated by `profile.showKeySettings`. i18n for providers + manager/add/empty/entry copy (en/es/de/pt).

## Done criteria
- [ ] Scenario(s) s1, s2, s3, s6, s7, s8, s9 covered by concrete component test(s) + Storybook + Playwright e2e (per storybook-e2e-tests skill)
- [ ] Configured rows, Add modal (unsaved-only picker), all 4 UI states; Add hidden when all six saved
- [ ] Raw key never rendered after save; guidance link per picked provider
- [ ] i18n keys added to every locale (en/es/de/pt); no hardcoded strings/colors/dimensions
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Reuse `RadioGroup`, `Dialog`, `TextField`, `Button`, `ProgressIndicator`. Follow atomic-design + component-split for `ApiKeyManager`. Fixed order groq→openai→anthropic→google→xai→deepseek. Lesson recovery CTA → `/settings/api-keys`.
