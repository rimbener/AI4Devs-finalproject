---
feature: lesson-route-header
slice: 1 (task-1 + task-2 — single slice)
---

# TDD log — lesson-route-header

## @s → test map

| @s | Test | File |
|---|---|---|
| s8 | `exposes exactly the three lesson routes in order, mapped to their nav title keys` | `libs/study-buddy/src/components/app-chrome/lesson-stack-screens.test.ts` |
| s1–s7 | not unit-tested (no header-rendering test runner assertion in app workspace per task-2 spec); verified via config wiring + check-types/lint; regression assertion updated (below) | `apps/app-study-buddy/src/app/(app)/_layout.tsx` |

## Cycles

**Cycle 1 (s8, task-1)**
- RED: wrote `lesson-stack-screens.test.ts` asserting `LESSON_STACK_SCREENS` equals the three `{ name, titleKey }` entries in order (index→nav.lesson, player→nav.study, results→nav.results). Failed: module not found.
- GREEN: added `lesson-stack-screens.ts` — pure `LessonStackScreenConfig` literal-union type + `LESSON_STACK_SCREENS` const array, mirroring `native-tabs-triggers.ts` shape (no React, no i18n resolution, no side effects).
- REFACTOR: none needed — already minimal and named per precedent.
- Barrel: exported `LessonStackScreenConfig` (type) + `LESSON_STACK_SCREENS` from `libs/study-buddy/src/index.ts`.

**Cycle 2 (s1–s7, task-2, config-only — no new unit test per task spec)**
- Rewrote `apps/app-study-buddy/src/app/(app)/_layout.tsx`: parent `<Stack>` now bare (default header shown); `headerShown: false` moved onto the `(tabs)` `<Stack.Screen>` only; the three lesson `<Stack.Screen>`s are now rendered by `.map()` over `LESSON_STACK_SCREENS` (from `@helsoft/study-buddy`), resolving `t(titleKey)` per entry. `unstable_settings.initialRouteName = '(tabs)'` retained (s4). No `headerLeft`/colors/custom chrome (D4). No `NativeTabs`/`Stack` nesting touched (s7).
- Regression found + fixed: a pre-existing source-text regression test in `apps/app-study-buddy/src/__tests__/app/(app)/tabs-layout.test.ts` (`@s9`, from the prior native-bottom-tabs feature) asserted the literal string `lesson/[id]` appeared in `_layout.tsx`. Since route names now live in `LESSON_STACK_SCREENS`, updated that assertion to check for `LESSON_STACK_SCREENS` + `@helsoft/study-buddy` import instead (same architectural intent: lesson routes registered as Stack siblings via a shared, non-hardcoded config), mirroring the existing `NATIVE_TAB_TRIGGERS` import-check pattern in the same file. Confirmed green after the change (no other test asserted the old literal string).

## Gate

- `pnpm --filter @helsoft/study-buddy test` — 36 suites / 261 tests green.
- `pnpm --filter app-study-buddy test` — 4 suites / 25 tests green (incl. updated `tabs-layout.test.ts`).
- `pnpm lint` — clean for touched workspaces (`@helsoft/study-buddy`, `app-study-buddy`); pre-existing unrelated `@helsoft/activities` package.json formatting failure on this branch, untouched by this slice.
- `pnpm check-types` — all 14 packages green.
- No hardcoded strings/colors/dimensions introduced; title keys resolved via existing `nav.lesson`/`nav.study`/`nav.results` i18n keys.
