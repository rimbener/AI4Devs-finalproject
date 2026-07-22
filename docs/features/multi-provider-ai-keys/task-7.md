---
id: task-7
title: New `invalid_model` error code across mirrored contract + i18n
slice: 2
scenarios: [s18]
status: todo
paths: [libs/types/src/lesson-generation.ts, libs/supabase-services/src/services/lesson-generation.service.ts, supabase/functions/generate-lesson/_shared/types.ts, supabase/functions/generate-lesson/_shared/lesson-generation.errors.ts, libs/study-buddy/src/components/lesson-generation/lesson-generation.helpers.ts, libs/localization/src/resources/]
---

## Goal
Add a new typed generation error code **`invalid_model`** end-to-end: `GenerationErrorCode` union (client `@helsoft/types` + hand-mirrored Deno `types.ts`), `GENERATION_ERROR_CODES` map, Edge `mapGenerationError`/error responses, the client-side error→i18n-key + recovery map (`lesson-generation.helpers.ts`), and new i18n strings in every locale. Choose an HTTP status (recommend 422) and a recovery affordance (recommend generic message, no retry — a crafted/stale request).

## Done criteria
- [ ] Scenario s18 covered by concrete test(s) across service + helpers
- [ ] `invalid_model` in every mirrored contract point + `GENERATION_ERROR_CODES`
- [ ] i18n message added to all locales; error→key + recovery mapped
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
`missing_key`/`invalid_key` unchanged. This lands the contract that task-9 (validation) emits and task-11 (UI) renders.
