# Add header with back button to lesson detail/player/results routes

**As a** Study Buddy user (web and native)
**I want** the lesson detail, player, and results screens to show a header with a back button and title
**so that** I have a clear, native way back to my lessons from any pushed screen — today there's no header there at all

## Context

- A recent merge replaced the old chrome with three root tabs — Home, PDF files, Settings (`NativeTabs` on native, `WebBottomTabs` on narrow web, `DesktopBar` on desktop web; see `libs/study-buddy/src/components/app-chrome/native-tabs-triggers.ts`). None of these root tab screens have a header today, and this story doesn't change that.
- `lesson/[id]/index`, `player`, and `results` (`apps/app-study-buddy/src/app/(app)/lesson/[id]/`) are siblings of `(tabs)` in `(app)/_layout.tsx`'s `Stack`, which has `headerShown: false`. So today they have zero header on every platform, including desktop (`DesktopBar` only wraps `(tabs)`, not these routes).
- Implement via expo-router's own `Stack.Screen` header API, not a manually-rendered component.
- Deliberately avoid touching `NativeTabs` — nesting a `Stack` inside a `NativeTabs.Trigger` (the documented way to get native per-tab headers) has a known SDK 57 bug that hangs iOS release builds at launch ([expo/expo#47687](https://github.com/expo/expo/issues/47687)). This story doesn't need that pattern since the target routes already sit on the outer `Stack`.

## Acceptance criteria

- `lesson/[id]/index`, `player`, and `results` each show a header with a back button and the screen's existing title (`nav.lesson` / `nav.study` / `nav.results`), on native (iOS/Android), narrow web, and desktop web.
- The back button navigates to the previous screen.
- Root tab screens (Home, PDF files, Settings) are unaffected — no header, on any platform, same as today.
- The existing Empty-state "Back", Error-state "Back", and completion "Back to lessons"/"Retake" CTAs inside `LessonPlayer`/`LessonResults` are unchanged — the header back button is additive.
- No `Stack` is nested inside any `NativeTabs.Trigger` as part of this work.

## Notes

No analytics event or feature flag needed.
