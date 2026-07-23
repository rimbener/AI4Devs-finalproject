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
Add the **web** tabs layout `(tabs)/_layout.web.tsx` that branches on `useBreakpoint()` (`@helsoft/hooks`, cutoff 768):
- `desktop` (≥768) → `AppChrome` (`DesktopBar`) + `<Slot/>`, **no** bottom bar
- `mobile` (<768) → **`WebBottomTabs`** (`@helsoft/components`) with `triggers` mapped from `NATIVE_TAB_TRIGGERS` + `t()` — Material-style bottom bar via headless `expo-router/ui` (`Tabs` / `TabSlot` / `TabList asChild` / `TabTrigger`)

Native keeps task-1's `_layout.tsx` (`NativeTabs`) with no web imports. NativeTabs on web renders top chrome and looks wrong — do **not** reuse it for narrow web.

## Done criteria
- [x] Scenario(s) s2, s3, s15 covered by concrete test(s)
- [x] Web <768 → `WebBottomTabs` Material bottom bar with My lessons + Settings (s2)
- [x] Web ≥768 → desktop top bar + `<Slot/>`, no bottom tab bar (s3)
- [x] Breakpoint mapping: web ≥768 desktop bar, web <768 Material bottom tabs, ios/android NativeTabs (s15)
- [x] `WebBottomTabs` organism + `WebBottomTabButton` molecule in `@helsoft/components` (stories, Jest, Playwright e2e); receives `triggers` prop
- [x] `TabList asChild` on the sticky bar View (wrapping `TabList` in a plain View breaks Expo screen discovery)
- [x] Resize across 768 is allowed to remount the tab subtree (accepted trade-off) — no crash; screen state is URL/server-driven
- [x] `pnpm lint` + `pnpm check-types` + `pnpm test` green
- [x] No hardcoded strings/colors/dimensions

## Notes
- Q3 lock (option A): platform-specific layouts; responsive branching quarantined to `_layout.web.tsx`.
- Desktop branch wires `AppChrome` (task-4 later slimmed it + removed New lesson from `DesktopBar`).
- Shared contract: `NATIVE_TAB_TRIGGERS` (`@helsoft/study-buddy`) — native layout uses sf/md; web maps to presentational `{ name, href, label, icon }`.
