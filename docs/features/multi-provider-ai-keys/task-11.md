---
id: task-11
title: LessonGenerationPanel provider + model RadioGroups (free-BYOK only) + i18n
slice: 2
scenarios: [s10, s11, s16, s19]
status: done
paths: [libs/components/src/organisms/lesson-generation-panel/, libs/localization/src/resources/]
---

## Goal
Add **Provider** then **Model** `RadioGroup`s inside `LessonGenerationPanel`, **above** the composition picker. Provider list = the saved providers passed in (fixed order); model list = curated models for the selected provider (labels via `labelKey` i18n). Pickers render **only** when the panel is in free-BYOK mode (driven by a prop); paid/platform hides them (s19). Selecting a provider surfaces its models; the parent owns selection state (controlled). Add i18n for all curated model display names + picker labels across locales.

## Done criteria
- [ ] Scenario(s) s10, s11, s16, s19 covered by concrete component test(s) + Storybook + Playwright e2e
- [ ] Provider/model RadioGroups above composition; free-BYOK-only visibility
- [ ] Controlled selection; empty/missing-key + paid variants render correctly
- [ ] i18n model labels in every locale; no hardcoded strings/colors/dimensions
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Presentational only (props for saved providers, registry-derived models, selected values, change handlers, `showPickers`). Selection reset-on-provider-change (s11) is enforced by the wiring (task-12) but the panel must render the reset result.
