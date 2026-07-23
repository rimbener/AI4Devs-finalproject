---
feature: lesson-route-header
story: user-stories/in-progress/lesson-route-header.md   # pending/ → in-progress/ → done/
status: spec_drafted
---

# Spec — lesson-route-header

## Summary
Give the three pushed lesson routes (`lesson/[id]/index`, `player`, `results`) a
native header with a back button and their existing title, on native / narrow web /
desktop web, via expo-router's own `Stack.Screen` header API — leaving the root tab
screens headerless as they are today.

## User stories
- As a **Study Buddy user (web and native)**, I want **the lesson detail, player, and
  results screens to show a header with a back button and title**, so that **I have a
  clear, native way back to my lessons from any pushed screen**.

## Acceptance criteria
→ **[`gherkin-scenarios.md`](./gherkin-scenarios.md)** — each `@s` scenario is an acceptance criterion. `@s1`–`@s3` header per route, `@s4` back-navigation (incl. deep-link → tab shell), `@s5` cross-platform, `@s6` player keeps header across all 4 states, `@s7` tabs stay headerless, `@s8` the lib screen-config factory.

## UI states (player — the only multi-state route)
Header sits at the Stack level and wraps all four states automatically (`@s6`).

| State | Trigger | Notes |
|---|---|---|
| Loading | `useLesson` loading | `PlayerLoading` inside `ScreenContainer`; header shown |
| Empty | lesson has 0 slides | Empty state inside `LessonPlayer`; existing "Back" CTA unchanged |
| Error | fetch error | Error state + retry inside `LessonPlayer`; existing "Back" CTA unchanged |
| Loaded | deck present | Slides + completion CTAs ("Back to my lessons" / "Retake") unchanged |

## Analytics events
None (per story).

## Feature flags
None.

## Out of scope / non-goals
- No change to `(tabs)` (Home / PDF files / Settings stay headerless on every platform).
- No touching `NativeTabs`; no `Stack` nested inside any `NativeTabs.Trigger` (SDK 57 iOS-hang, expo/expo#47687).
- No custom header styling/theming (colors, label, icon, title alignment) — default header, matching `(auth)`.
- No change to existing in-screen CTAs; the header back button is additive.
- No `ScreenContainer` / safe-area change — the native header owns the top inset.
- No new i18n keys — reuse `nav.lesson` / `nav.study` / `nav.results`.

## Open decisions (resolved, with rationale)
- **D1 — Testing via lib factory** — extract the screen config into a pure factory in `@helsoft/study-buddy` (`lesson-stack-screens.ts`, beside `native-tabs-triggers.ts`), unit-tested there; the app maps over it. **Why:** gives a testable unit (the app has no test runner); "app composes from libs."
- **D2 — Bare Stack + hide only `(tabs)`** — parent `<Stack>` bare, `headerShown: false` on the `(tabs)` screen only. **Why:** mirrors the `(auth)/_layout.tsx` precedent; lesson screens already carry titles.
- **D3 — Configure `results` header too** despite its `<Redirect>` making it invisible today. **Why:** satisfies the AC's literal three-route list; correct if the redirect is removed.
- **D4 — Plain platform defaults** — default back button, `router.back()` pop, no custom chrome; default React Navigation header on desktop web too. **Why:** consistency with the only existing header precedent; minimal scope. Deep-link back stays safe via `unstable_settings.initialRouteName = '(tabs)'`.

_Risks + dependencies: `tmp/lesson-route-header/risks.md` (gitignored)._
