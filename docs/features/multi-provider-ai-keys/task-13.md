---
id: task-13
title: GenerationPreferenceDao + Service (@helsoft/services)
slice: 3
scenarios: [s20, s21]
status: done
paths: [libs/services/src/dao/generation-preference.dao.ts, libs/services/src/services/generation-preference.service.ts, libs/services/src/dao/index.ts, libs/services/src/services/index.ts]
---

## Goal
Persist the last-used `{ provider, model }` on the device. New `GenerationPreferenceDao` (AsyncStorage) under key `study-buddy.generation-preference` storing a JSON `{ provider, model }`; new `GenerationPreferenceService` that reads (never throws — corrupt/missing/unparseable → `null`) and writes. Validation of "still valid" (provider saved + model in registry) lives in the wiring (task-14); the service just stores/retrieves + guards against corrupt JSON.

## Done criteria
- [ ] Scenario(s) s20, s21 covered by concrete DAO + Service test(s)
- [ ] One key, `{ provider, model }` JSON; forgiving reads (corrupt/missing → null)
- [ ] Barrel exports added
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Mirror `LocalePreferenceDao`/`LocalePreferenceService` pattern (AsyncStorage, `@helsoft/services`). No server/schema change; device-only (no cross-device sync).
