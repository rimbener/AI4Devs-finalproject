---
id: task-2
title: Wire the lesson-route header into (app)/_layout.tsx
slice: 1
scenarios: [s1, s2, s3, s4, s5, s6, s7]
status: todo
paths:
  - apps/app-study-buddy/src/app/(app)/_layout.tsx
---

## Goal
Show the default expo-router native header (back button + existing title) on the
three pushed lesson routes across native / narrow web / desktop web, while keeping
the root tab screens headerless — using the `Stack.Screen` header API only, no
manually-rendered header.

## Done criteria
- [ ] Scenarios {s1, s2, s3, s4, s5, s6, s7} satisfied by the layout config
- [ ] Parent `<Stack>` is bare (default `headerShown: true`), mirroring
      `(auth)/_layout.tsx`; `headerShown: false` set **only** on the `(tabs)`
      `<Stack.Screen>`
- [ ] The three lesson `<Stack.Screen>`s are rendered by mapping the task-1 factory
      (`libs/study-buddy` `lesson-stack-screens`), resolving each `titleKey` via
      `t(...)` from `useLocalization()`
- [ ] Default back button and default `router.back()` pop — no custom
      `headerLeft` / label / icon / colors / title alignment (matches `(auth)`)
- [ ] `unstable_settings.initialRouteName = '(tabs)'` retained so deep-link back
      lands on the tab shell (s4)
- [ ] No `<Stack>` nested inside any `NativeTabs.Trigger`; `NativeTabs` untouched (s7)
- [ ] `ApiKeyProvider` / `ProfileProvider` wrapping unchanged
- [ ] `pnpm lint` + `pnpm check-types` green
- [ ] No hardcoded strings/colors/dimensions

## Notes
- Current file already carries the three `title` options and the
  `screenOptions={{ headerShown: false }}` that suppresses them; the change is to
  invert the default (bare Stack, hide only `(tabs)`) and source the screen list
  from the lib factory.
- The app workspace has no test runner, so scenarios s1–s7 are verified by
  check-types + lint + reviewer + manual/visual check (called out in risks R2).
  The header is applied at the Stack level, so the player's four states (s6) and
  cross-platform rendering (s5) come for free from a single config.
- Results (s3) renders a `<Redirect>` today, so its header is practically
  invisible; still configured for AC completeness.
- Do not add safe-area handling to screens/`ScreenContainer` — the native header
  consumes the top inset.
