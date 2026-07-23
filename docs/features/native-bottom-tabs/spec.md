---
feature: native-bottom-tabs
story: user-stories/done/native-bottom-tabs.md
status: approved
---

# Spec — native-bottom-tabs
_Terse overview. ACs → `gherkin-scenarios.md`; tasks → `task-N.md`; risks → `tmp/native-bottom-tabs/risks.md`._

## Summary
Replace the MVP custom mobile chrome with Expo Router **`NativeTabs`** on iOS/Android, a Material-style **`WebBottomTabs`** organism (`@helsoft/components`) on narrow web (<768), and **`DesktopBar`** on wide web (≥768). Primary destinations are **My lessons**, **My PDF files**, and **Settings**. **New Lesson** is a CTA on My lessons that opens the **PDF files** tab (`/pdf-files`); there is no separate `/upload` route. Lesson flows remain Stack siblings (no tab bar).

## User stories
- As a **signed-in learner**, I want bottom tabs (My lessons, PDF files, Settings) on native/narrow web and the desktop top bar on wide web, so that navigation feels platform-native and creating a lesson starts from the PDF files surface.

## Acceptance criteria
→ **`gherkin-scenarios.md`** — each `@s` scenario is an AC (Given/When/Then).

## UI states (nav chrome)
| State | Trigger | Notes |
|---|---|---|
| Content | Signed-in; session known | NativeTabs (iOS/Android) / WebBottomTabs (web <768) / DesktopBar (web ≥768); current tab marked selected; My lessons shows New Lesson CTA (@s1–@s6) |
| Loading | `useSession().isLoading` | Gated upstream — tabs mount only when authed |
| Empty | My lessons has no lessons | List empty state still shows the persistent New Lesson CTA (@s6) |
| Error | N/A for nav | No fetch in nav; sign-out keeps existing `SignOut` `onSignOutError` no-op |

## Analytics events
None — MVP.

## Feature flags
None.

## Out of scope / non-goals
- Redesigning `DesktopBar` visuals beyond primary nav destinations; guest/marketing nav; real notifications
- Changing lesson player internals beyond keeping the tab bar off lesson routes
- Deleting `AccountMenu` (still used by the desktop avatar)

## Open decisions (resolved, with rationale)
- **Adopt `expo-router/unstable-native-tabs` `NativeTabs` on iOS/Android** — in-ecosystem system tab bar; `unstable-` isolated to native `(tabs)/_layout.tsx`. (Q1)
- **Route restructure: `(app)/_layout` Stack → `(tabs)` (`index`, `pdf-files`, `settings`) + `lesson/[id]/*` siblings** — tab bar only inside `(tabs)`; groupless URLs unchanged. **No `/upload` Stack screen** — PDF upload/generate lives on the PDF files tab via self-contained `PdfDocuments`. (Q2, amended)
- **Three tabs (My lessons, My PDF files, Settings); New Lesson is a CTA, not a tab** — CTA pushes `/pdf-files` where `NewLessonDialog` + list live. (rev Q1/Q4, amended)
- **Persistent New Lesson CTA in `SavedLessons` → `/pdf-files`** — create reachable from content + empty; label `nav.newLesson`. (rev Q2, amended)
- **DesktopBar primary nav: My lessons + My PDF files** — Settings stays in `AccountMenu` only; no New lesson bar item. (rev Q3 / Q5, amended)
- **Web split via platform-specific layouts** — native `_layout.tsx` = `NativeTabs`; `_layout.web.tsx` ≥768 `AppChrome`+`Slot`, <768 `WebBottomTabs` + `triggers` from `NATIVE_TAB_TRIGGERS`. (Q3)
- **Reuse labels + glyphs** — `nav.myLessons` / `nav.myPdfFiles` / `nav.settings`; shared `NATIVE_TAB_TRIGGERS` (`sf`/`md`/`href`); web maps to `{ name, href, label, icon }`. (Q4, amended)
- **`DesktopBar` avatar `AccountMenu` (Settings + Sign out) on wide web** — only Settings/sign-out path on desktop. (Q5)
- **Delete `MobileBar`; keep `AccountMenu`; desktop-only `AppChrome`**. (Q6)
- **Sign-out** — `AccountMenu` on wide web; Settings `SignOut` when `breakpoint === 'mobile'`. (Q7)
- **`WebBottomTabs` + `WebBottomTabButton` in `@helsoft/components`** — prop-driven `triggers`; stories/Jest/e2e; `expo-router` peer. (post-impl)
- **`PdfDocuments` self-contained** — no props; owns router, profile gate, `NewLessonDialog`; used by `(tabs)/pdf-files`. (post-impl)
