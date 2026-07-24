---
id: task-14
title: LessonGeneration preselect-on-open (validated fallback) + write-on-generate
slice: 3
scenarios: [s20, s21]
status: done
paths: [libs/study-buddy/src/components/lesson-generation/lesson-generation.tsx]
---

## Goal
Preselect the last-used provider+model. On open, read the stored preference; preselect it **only if valid** — provider still a saved key AND model still in that provider's curated list. If invalid (deleted key / retired model / corrupt / missing), fall back quietly to the **first saved provider** (fixed order) + that provider's **first curated model** — no crash. On generate, write the current `{ provider, model }` back. Free-BYOK only.

## Done criteria
- [ ] Scenario(s) s20, s21 covered by concrete component/integration test(s)
- [ ] Valid preference preselected; invalid/missing/corrupt → quiet first-provider/first-model fallback
- [ ] Preference written on generate; no crash on any read outcome
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Builds on task-12 selection state + task-13 service. Covers story AC5's "if last-used was deleted, fall back to another saved provider (stable order), or the missing-key gate if none left" (none-left → task-12's s16 gate).
