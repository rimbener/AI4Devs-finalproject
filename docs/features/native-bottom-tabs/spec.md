---
feature: native-bottom-tabs
story: user-stories/in-progress/native-bottom-tabs.md
status: approved
---

# Spec — native-bottom-tabs
_Terse overview. ACs → `gherkin-scenarios.md`; tasks → `task-N.md`; risks → `tmp/native-bottom-tabs/risks.md`._

## Summary
Replace the MVP custom mobile chrome with Expo Router **`NativeTabs`** on iOS/Android and narrow web (<768), keeping the existing `DesktopBar` on wide web (≥768). The tab bar holds only durable destinations — **My lessons** + **Settings**; **New Lesson** is a CTA on My lessons (not a tab), and `/upload` + lesson flows are immersive (no tab bar).

## User stories
- As a **signed-in learner**, I want system-native bottom tabs (My lessons, Settings) on native/narrow web and the desktop top bar on wide web, so that navigation feels platform-native and New Lesson opens as a focused task from My lessons.

## Acceptance criteria
→ **`gherkin-scenarios.md`** — each `@s` scenario is an AC (Given/When/Then).

## UI states (nav chrome)
| State | Trigger | Notes |
|---|---|---|
| Content | Signed-in; session known | NativeTabs (native / web <768) or DesktopBar (web ≥768); current tab marked selected for AT; My lessons shows the New Lesson CTA (@s1–@s6) |
| Loading | `useSession().isLoading` | Gated upstream — root layout renders nothing until session resolves; tabs mount only when authed. No separate tab spinner |
| Empty | My lessons has no lessons | List empty state still shows the persistent New Lesson CTA (@s6) |
| Error | N/A for nav | No fetch in nav; sign-out keeps existing `SignOut` `onSignOutError` no-op |

## Analytics events
None — MVP.

## Feature flags
None.

## Out of scope / non-goals
- Redesigning `DesktopBar` visuals (beyond removing the New lesson nav item); guest/marketing nav; real notifications
- Changing lesson player / upload internals beyond keeping the tab bar + desktop chrome off those routes
- Deleting `AccountMenu` (still used by the desktop avatar)

## Open decisions (resolved, with rationale)
- **Adopt `expo-router/unstable-native-tabs` `NativeTabs`** — only in-ecosystem system tab bar; no new package; `unstable-` risk isolated to layout files, accepted. (Q1)
- **Route restructure: `(app)/_layout` Stack → `(tabs)` group (`index` + `settings`) + `upload` and `lesson/[id]/*` as siblings** — tab bar mounts only inside `(tabs)`, so `/upload` + lesson flows never show it by construction; `(tabs)` groupless → URLs unchanged. (Q2 + rev Q1)
- **Two tabs only (My lessons + Settings); New Lesson is an action, not a tab** — `/upload` is a pushed immersive Stack sibling with header/back; My lessons stays selected while open — create is a transient task, native convention pushes it. (rev Q1 + Q4)
- **Persistent New Lesson CTA in `SavedLessons` header (content + empty), shared `Button` + `nav.newLesson`, pushes `/upload`** — create must be reachable in any list state; wiring in feature-lib, button presentational; reuses existing label. (rev Q2)
- **Remove New lesson nav item from `DesktopBar`; My lessons CTA is the sole create entry everywhere** — keeping top-nav contradicts "action, not destination" and doubles the entry; DesktopBar otherwise unchanged. (rev Q3, amends Q5)
- **Web split via platform-specific layouts** — native `_layout.tsx` = `NativeTabs`; `_layout.web.tsx` branches on `useBreakpoint()` (≥768 DesktopBar+`Slot`, <768 NativeTabs) — quarantines responsive logic, keeps native bundle web-free; resize-across-768 remount accepted. (Q3)
- **Reuse labels + platform glyphs** — `nav.myLessons` (sf `books.vertical`/`menu_book`), `nav.settings` (sf `gearshape`/`settings`); no New lesson glyph in the bar; web label-only fallback — labels already translated; graceful degrade. (Q4)
- **`DesktopBar` avatar `AccountMenu` (Settings + Sign out) unchanged on wide web** — it is wide web's only Settings/sign-out path. (Q5)
- **Delete `MobileBar` (+ stories/tests/e2e); keep `AccountMenu`; slim `AppChrome` to desktop-only** — bar superseded by NativeTabs; removing dead code keeps the system honest; `AccountMenu` still serves the desktop avatar. (Q6)
- **Sign-out placement** — `AccountMenu` on wide web; uncontrolled `SignOut` on Settings only where there is no `AccountMenu` (`breakpoint === 'mobile'`); no wide-web duplicate — else native/narrow sign-out is stranded. (Q7)
