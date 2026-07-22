---
id: task-2
title: Web layout — breakpoint DesktopBar vs NativeTabs
slice: 1
scenarios: [s2, s3, s15]
status: done
paths: [apps/app-study-buddy/src/app/(app)/(tabs)/_layout.web.tsx]
---

## Goal
Add the **web** tabs layout `(tabs)/_layout.web.tsx` that branches on `useBreakpoint()` (`@helsoft/hooks`, cutoff 768): `desktop` (≥768) renders the desktop chrome + `<Slot/>` and **no** bottom bar; `mobile` (<768) renders the same 2-tab `NativeTabs` as native. This file is web-only (`.web.tsx`), so native keeps task-1's `_layout.tsx` with no web imports.

## Done criteria
- [ ] Scenario(s) s2, s3, s15 covered by concrete test(s)
- [ ] Web <768 → `NativeTabs` bottom bar with My lessons + Settings (s2)
- [ ] Web ≥768 → desktop top bar + `<Slot/>`, no bottom tab bar (s3)
- [ ] Breakpoint mapping matches the outline: web ≥768 desktop bar, web <768 tabs, ios/android tabs (s15)
- [ ] Resize across 768 is allowed to remount the tab subtree (accepted trade-off) — no crash; screen state is URL/server-driven
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green
- [ ] No hardcoded strings/colors/dimensions

## Notes
- Q3 lock (option A): platform-specific layouts; all responsive branching quarantined to `_layout.web.tsx`.
- At implementation time task-2 wires the desktop branch to the **existing** `AppChrome` (its desktop branch already renders `DesktopBar`), so Slice 1 is independently testable; task-4 (Slice 2) later slims `AppChrome` + removes the New lesson item from `DesktopBar`.
