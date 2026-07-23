---
id: task-8
title: GenerateLessonRequest += provider?/model? (client + Deno mirror + service/DAO)
slice: 2
scenarios: [s12]
status: done
paths: [libs/types/src/lesson-generation.ts, libs/supabase-services/src/services/lesson-generation.service.ts, libs/supabase-services/src/dao/lesson-generation.dao.ts, supabase/functions/generate-lesson/_shared/types.ts]
---

## Goal
Extend the generation request contract with optional provider/model. `GenerateLessonRequest = { documentId, composition, provider?: AiProvider, model?: string }` in `@helsoft/types` and the hand-mirrored Deno `types.ts`. `LessonGenerationService.generate` + `LessonGenerationDao.generateLesson` pass `provider`/`model` through unchanged (no client-side validation beyond existing input checks). Free BYOK sends provider+model; platform path omits them.

## Done criteria
- [ ] Scenario s12 covered by concrete service + DAO test(s)
- [ ] Optional `provider`/`model` threaded to the Edge invoke body
- [ ] Deno `types.ts` mirror updated (parity note)
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Wire-shape only; server-side selection/validation is task-9. Keep the platform path byte-compatible when the fields are absent.
