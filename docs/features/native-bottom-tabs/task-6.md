---
id: task-6
title: Delete retired MobileBar from the design system
slice: 3
scenarios: [s2, s17]
status: done
paths:
  [
    libs/components/src/organisms/mobile-bar/,
    libs/components/src/organisms/index.ts,
    libs/components/tests/e2e/,
  ]
---

## Goal
Remove the MVP custom `MobileBar` now that native/narrow-web nav is `NativeTabs`. Delete the `mobile-bar/` folder (component, `.types.ts`, stories, unit test), drop its export from `organisms/index.ts`, and remove any `mobile-bar` Playwright e2e. Keep `AccountMenu` (still used by `DesktopBar`'s avatar).

## Done criteria
- [x] Scenario(s) s2, s17 covered (build/export assertions + no dangling imports)
- [x] `MobileBar` component, `.types.ts`, `.stories.tsx`, `.test.tsx`, and its e2e are deleted (s17)
- [x] `organisms/index.ts` no longer exports `MobileBar`; no remaining importers repo-wide (s17)
- [x] `AccountMenu` untouched and still exported (s17)
- [x] Narrow/native primary nav is `NativeTabs`, the old bar is no longer the product nav (s2)
- [x] `pnpm lint` + `pnpm check-types` + `pnpm test` green (component + Storybook build)
- [x] No hardcoded strings/colors/dimensions introduced

## Notes
- Q6 lock (option B): delete `MobileBar` (+ stories/tests/e2e); keep `AccountMenu`.
- Run last so no live importer remains (task-4 removed the only wiring).
