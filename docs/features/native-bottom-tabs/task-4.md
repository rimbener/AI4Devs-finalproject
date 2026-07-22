---
id: task-4
title: Trim desktop chrome — remove New lesson, slim AppChrome to desktop-only
slice: 2
scenarios: [s3, s11, s12]
status: todo
paths:
  [
    libs/components/src/organisms/desktop-bar/desktop-bar.tsx,
    libs/components/src/organisms/desktop-bar/desktop-bar.types.ts,
    libs/components/src/organisms/desktop-bar/desktop-bar.stories.tsx,
    libs/components/src/organisms/desktop-bar/desktop-bar.test.tsx,
    libs/study-buddy/src/components/app-chrome/app-chrome.tsx,
    libs/study-buddy/src/components/app-chrome/use-app-chrome.ts,
    libs/study-buddy/src/components/app-chrome/app-chrome.helpers.ts,
    libs/study-buddy/src/components/app-chrome/app-chrome.helpers.test.ts,
    libs/study-buddy/src/components/app-chrome/app-chrome.test.tsx,
    libs/study-buddy/src/components/app-chrome/use-app-chrome.test.ts,
  ]
---

## Goal
Two coupled desktop-chrome trims now that New Lesson is a CTA (task-3) and native/narrow nav is `NativeTabs`:
1. **Remove the New lesson nav item from `DesktopBar`** — drop its `NavItem`, remove the `newLesson` prop from `DesktopBarProps`, update stories + tests. `DesktopBar` keeps brand, **My lessons**, alerts placeholder, and the avatar/`AccountMenu`.
2. **Slim `AppChrome` to desktop-only** — remove the `MobileBar` branch/import, the mobile-title path (`getMobileTitleKey`) + mobile safe-area bits, and the now-unused New lesson handler/props. It renders only `DesktopBar` + `AccountMenu` (Settings + Sign out) via the controlled `SignOut`.

## Done criteria
- [ ] Scenario(s) s3, s11, s12 covered by concrete test(s)
- [ ] `DesktopBar` shows My lessons only (no New lesson, no Settings nav item); `newLesson` prop removed; stories/tests updated (s3)
- [ ] `AppChrome` renders `DesktopBar` + `AccountMenu` with no `MobileBar` reference; `getMobileTitleKey`/mobile bits deleted
- [ ] Settings reachable from the desktop avatar `AccountMenu`, not a bar item (s11)
- [ ] Sign out available from the desktop `AccountMenu` via the existing confirm flow (s12)
- [ ] No remaining importers of the removed `newLesson` prop / mobile-title helper repo-wide
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green
- [ ] No hardcoded strings/colors/dimensions

## Notes
- Locks: Q5 DesktopBar otherwise unchanged; Q6 strip dead app wiring; revision Q3 remove New lesson from DesktopBar (CTA is the sole create entry).
- `AccountMenu` stays in `@helsoft/components` (still used here); only `MobileBar` is deleted (task-6).
- `nav.newLesson` is no longer a chrome nav label — it is the CTA label (task-3).
