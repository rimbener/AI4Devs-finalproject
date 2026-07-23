---
id: task-1
title: Add lesson-stack screen-config factory to @helsoft/study-buddy
slice: 1
scenarios: [s8]
status: todo
paths:
  - libs/study-buddy/src/components/app-chrome/lesson-stack-screens.ts
  - libs/study-buddy/src/components/app-chrome/lesson-stack-screens.test.ts
  - libs/study-buddy/src/index.ts
---

## Goal
Provide a pure, testable factory that declares the three pushed lesson routes and
their i18n title keys, so the app layout composes the header config from a lib
rather than hardcoding it. Colocated with the existing `native-tabs-triggers.ts`
under `app-chrome`. The factory returns i18n **keys** only — it does no React
rendering and no `t(...)` resolution (the app resolves keys).

## Done criteria
- [ ] Scenario {s8} covered by a concrete unit test (`lesson-stack-screens.test.ts`)
- [ ] Exports a typed config: an ordered array of `{ name, titleKey }`, using
      literal-union types (mirroring `NativeTabTriggerConfig`) — `name` ∈
      `lesson/[id]/index` | `lesson/[id]/player` | `lesson/[id]/results`,
      `titleKey` ∈ `nav.lesson` | `nav.study` | `nav.results`
- [ ] Order is index → player → results, mapping to nav.lesson → nav.study → nav.results
- [ ] No React import, no i18n resolution, no side effects (pure module)
- [ ] Exported through `libs/study-buddy/src/index.ts` barrel
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` (study-buddy) green
- [ ] No hardcoded strings/colors/dimensions (title keys are the i18n keys)

## Notes
- Model the shape on `libs/study-buddy/src/components/app-chrome/native-tabs-triggers.ts`
  (`NativeTabTriggerConfig` + `NATIVE_TAB_TRIGGERS`), including `as const`/`readonly`.
- The `titleKey` union must stay assignable to the localization `t()` key type so the
  app's `t(titleKey)` call type-checks.
- This is the only unit-testable unit in the feature (the app workspace has no test
  runner); the header wiring itself (task-2) is declarative config verified by
  check-types / lint / reviewer.
