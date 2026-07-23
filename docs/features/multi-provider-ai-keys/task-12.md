---
id: task-12
title: LessonGeneration wiring — saved providers + registry, free-BYOK gating
slice: 2
scenarios: [s10, s11, s16, s19]
status: done
paths: [libs/study-buddy/src/components/lesson-generation/lesson-generation.tsx, libs/study-buddy/src/components/lesson-generation/lesson-generation.types.ts]
---

## Goal
Wire the generate pickers. `LessonGeneration` reads `useApiKey().status.keys` (saved providers) + `AI_MODEL_REGISTRY` (models) + `useProfile().keySource` to decide free-BYOK vs platform. Owns provider/model selection state: switching provider resets model to that provider's first curated model (s11). Passes `showPickers = keySource !== 'platform'` to `LessonGenerationPanel`; on generate, includes `provider`/`model` in the request only for free BYOK (platform omits them, s19). No saved keys → existing missing-key gate path (s16).

## Done criteria
- [ ] Scenario(s) s10, s11, s16, s19 covered by concrete component/integration test(s)
- [ ] Free-BYOK sends provider+model; platform path unchanged (no fields)
- [ ] Provider-change resets model; saved-providers-only source
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Last-used preselect/write is task-14 (Slice 3) — here selection defaults to first saved provider + first curated model. Keep composition + existing error/recovery wiring intact.
