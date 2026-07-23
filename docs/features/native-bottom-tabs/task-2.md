---
id: task-2
title: Web layout — breakpoint DesktopBar vs WebBottomTabs
slice: 1
scenarios: [s2, s3, s15]
status: done
paths:
  [
    apps/app-study-buddy/src/app/(app)/(tabs)/_layout.web.tsx,
    libs/components/src/organisms/web-bottom-tabs/,
    libs/components/src/molecules/web-bottom-tab-button/,
    libs/components/tests/e2e/organisms/web-bottom-tabs/,
    libs/components/tests/e2e/molecules/web-bottom-tab-button/,
  ]
---

## Goal
Web `(tabs)/_layout.web.tsx` branches on `useBreakpoint()`:
- `desktop` (≥768) → `AppChrome` (`DesktopBar`: My lessons + My PDF files) + `<Slot/>`
- `mobile` (<768) → **`WebBottomTabs`** with `triggers` from `NATIVE_TAB_TRIGGERS` + `t()`

## Done criteria
- [x] s2, s3, s15 covered by tests
- [x] Web <768 → `WebBottomTabs` with three tabs (s2)
- [x] Web ≥768 → desktop bar + Slot, no bottom bar (s3)
- [x] `WebBottomTabs` / `WebBottomTabButton` in `@helsoft/components` (stories, Jest, e2e)
- [x] `TabList asChild` for screen discovery
- [x] lint / types / tests green

## Notes
- Native keeps `_layout.tsx` (`NativeTabs`) — no web imports.
