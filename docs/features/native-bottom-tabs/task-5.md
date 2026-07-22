---
id: task-5
title: Settings sign-out on native + narrow web only
slice: 2
scenarios: [s13, s14]
status: todo
paths:
  [
    libs/study-buddy/src/components/settings-sign-out/,
    libs/study-buddy/src/index.ts,
    apps/app-study-buddy/src/app/(app)/(tabs)/settings.tsx,
  ]
---

## Goal
Give native/narrow-web users a Sign out now that the mobile chrome `AccountMenu` is gone. Add a small `SettingsSignOut` component in `@helsoft/study-buddy` that renders the existing uncontrolled `SignOut` (button + confirm dialog) **only when** `useBreakpoint() === 'mobile'` (native iOS/Android + web <768) and renders `null` on `desktop` (≥768). Compose it into the Settings screen. On wide web the desktop `AccountMenu` remains the sign-out path — no duplicate on the Settings screen.

## Done criteria
- [ ] Scenario(s) s13, s14 covered by concrete test(s)
- [ ] On native / web <768: Settings screen shows `SignOut`; confirming clears session → login (s13, reuses `useAuth().signOut()` + existing confirm keys)
- [ ] On web ≥768: `SettingsSignOut` renders nothing on the Settings screen (s14)
- [ ] Component unit test `settings-sign-out.test.tsx` asserts breakpoint gating both ways
- [ ] Reuses existing `SignOut` (`@helsoft/study-buddy`) uncontrolled mode + `auth.logOut*` keys — no new i18n keys
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green
- [ ] No hardcoded strings/colors/dimensions

## Notes
- Q7 lock (refined): sign-out only where there is no `AccountMenu` = `breakpoint === 'mobile'`.
- Settings screen path is `(app)/(tabs)/settings.tsx` after the task-1 restructure.
- Gating lives in the study-buddy component (testable in jest), mirroring `AppChrome` using `useBreakpoint`.
