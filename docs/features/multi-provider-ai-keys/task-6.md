---
id: task-6
title: ApiKeyManager organism + ApiKeyForm refactor + ApiKeySettings + i18n
slice: 1
scenarios: [s1, s2, s3, s6, s7, s8, s9]
status: done
paths: [libs/components/src/organisms/api-key-manager/, libs/components/src/organisms/api-key-form/, libs/study-buddy/src/components/api-key-settings/api-key-settings.tsx, libs/localization/src/resources/]
---

## Goal
Build the multi-provider settings UI. New presentational organism **`ApiKeyManager`** (`@helsoft/components`): one masked row per saved provider (name + "saved · updated {date}" + Replace/Remove via the confirm `Dialog`), rows in fixed provider order; an **Add new provider** action revealing a provider `RadioGroup` of **not-yet-saved** providers + a secure key `TextField` + Save + per-provider guidance link; empty state (no rows, add visible), all-six-saved (add hidden), loading spinner, error banner. Props-driven only. Refactor `ApiKeyForm` into the add/replace sub-form reused by the manager (no duplicated input/confirm logic). Wire `ApiKeySettings` (`@helsoft/study-buddy`) to `useApiKey()` multi-key state, still gated by `profile.showKeySettings`. Add i18n keys (provider display names for all six + manager/add-flow copy) across all locale resources.

## Done criteria
- [ ] Scenario(s) s1, s2, s3, s6, s7, s8, s9 covered by concrete component test(s) + Storybook + Playwright e2e (per storybook-e2e-tests skill)
- [ ] Configured rows, add flow (unsaved-only picker), all 4 UI states; add hidden when all six saved
- [ ] Raw key never rendered after save; guidance link per picked provider
- [ ] i18n keys added to every locale (en/es/de/pt); no hardcoded strings/colors/dimensions
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Reuse `RadioGroup`, `Dialog`, `TextField`, `Button`, `ProgressIndicator`. Follow atomic-design + component-split (tsx/types/hook/helpers) for `ApiKeyManager`. Fixed order groq→openai→anthropic→google→xai→deepseek.
