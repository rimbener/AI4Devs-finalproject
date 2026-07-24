---
id: task-2
title: Wire the lesson-route header into (app)/_layout.tsx
slice: 1
scenarios: [s1, s2, s3, s4, s5, s6, s7]
status: done
paths:
  - apps/app-study-buddy/src/app/(app)/_layout.tsx
---

## Goal
Show the default expo-router native header (back button + existing title) on the
three pushed lesson routes across native / narrow web / desktop web, while keeping
the root tab screens headerless — using the `Stack.Screen` header API only, no
manually-rendered header.

## Done criteria
- [x] Scenarios {s1, s2, s3, s4, s5, s6, s7} satisfied by the layout config
- [x] Parent `<Stack>` is bare (default `headerShown: true`), mirroring
      `(auth)/_layout.tsx`; `headerShown: false` set **only** on the `(tabs)`
      `<Stack.Screen>`
- [x] The three lesson `<Stack.Screen>`s are rendered by mapping the task-1 factory
      (`libs/study-buddy` `lesson-stack-screens`), resolving each `titleKey` via
      `t(...)` from `useLocalization()`
- [x] Default back button and default `router.back()` pop — no custom
      `headerLeft` / label / icon / colors / title alignment (matches `(auth)`)
- [x] `unstable_settings.initialRouteName = '(tabs)'` retained so deep-link back
      lands on the tab shell (s4)
- [x] No `<Stack>` nested inside any `NativeTabs.Trigger`; `NativeTabs` untouched (s7)
- [x] `ApiKeyProvider` / `ProfileProvider` wrapping unchanged
- [x] `pnpm lint` + `pnpm check-types` green
- [x] No hardcoded strings/colors/dimensions

## Notes
- Current file already carries the three `title` options and the
  `screenOptions={{ headerShown: false }}` that suppresses them; the change is to
  invert the default (bare Stack, hide only `(tabs)`) and source the screen list
  from the lib factory.
- `apps/app-study-buddy` **does** have jest + `@testing-library/react-native`
  (already used by `tabs-layout.native.test.tsx` / `tabs-layout-web.test.tsx`).
  `apps/app-study-buddy/src/__tests__/app/(app)/app-layout-settings.test.tsx`
  renders `AppLayout` with `Stack`/`Stack.Screen` mocked to capture `name`/
  `options` and asserts, per route: `(tabs)` has `headerShown: false` (s7); each
  lesson screen's `options.title` resolves via the mocked `t(titleKey)` with no
  `headerShown: false` override (s1–s3); and the render order matches
  `LESSON_STACK_SCREENS` (s8 wiring). The header is applied at the Stack level
  (not per-screen chrome), so the player's four states (s6) and cross-platform
  rendering (s5) come for free from that single config — no separate test needed
  for s5/s6 once the above pass.
- Results (s3) renders a `<Redirect>` today, so its header is practically
  invisible; still configured for AC completeness.
- Do not add safe-area handling to screens/`ScreenContainer` — the native header
  consumes the top inset.
