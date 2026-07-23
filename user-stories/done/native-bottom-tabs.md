# Native bottom tabs navigation

**As a** signed-in learner
**I want** system-native bottom tabs on iOS, Android, and narrow web, with the existing desktop top bar on wide web
**so that** primary navigation feels platform-native and I can reach My lessons, New lesson, and Settings without the MVP custom chrome

## Context
- Replaces the MVP `navigation-menus` chrome for mobile/narrow viewports: custom `MobileBar` + `AppChrome` account menu were a quick design, not the target UX. Prefer **native UI**.
- Use Expo Router **`NativeTabs`** (`expo-router/unstable-native-tabs`) on iOS/Android and on **web &lt; 768**. Wide web (**≥ 768**) keeps the existing **`DesktopBar`** (brand + My lessons + New lesson + alerts placeholder + avatar cluster as today for those items — **do not add Settings to the desktop top nav**).
- Primary tabs (3): **My lessons** → `/`, **New lesson** → `/upload`, **Settings** → `/settings`. Settings is a tab on native/narrow web only; on wide web Settings remains reachable via `/settings` (in-body links, deep link, or existing Settings entry points — **not** a DesktopBar nav item).
- Lesson flows (`/lesson/[id]`, player, results) must **not** show the tab bar. Prefer Stack parent with `(tabs)` + `lesson/[id]/*` as siblings so lesson routes never mount the tab bar.
- Sign out stays on the Settings screen (existing flow). Retire chrome-level **AccountMenu** / avatar-as-settings entry on mobile once Settings is a tab.
- Platform split is fine (`_layout.web.tsx`, `app-tabs.tsx` / `.web.tsx`, etc.). Breakpoint stays **768** via existing `useBreakpoint` (or equivalent) for the web desktop vs tabs switch.
- Out of scope: redesigning DesktopBar visuals; guest/marketing nav; real notifications; changing lesson player internals beyond hiding/removing tab chrome on those routes.

## Acceptance criteria
- Given a signed-in learner on **iOS or Android**, when they use the authenticated shell on My lessons / New lesson / Settings, then they see Expo **NativeTabs** with three tabs for those routes and system-native tab bar appearance.
- Given a signed-in learner on **web width &lt; 768**, when they use the same routes, then they see the NativeTabs web/system-like bottom bar with the same three destinations (not the old `MobileBar`).
- Given a signed-in learner on **web width ≥ 768**, when they use the app shell, then they see the existing **DesktopBar** (Home/My lessons + New lesson; no Settings item in the bar) and **no** bottom tab bar.
- Given the learner opens **Settings** from a tab (native / narrow web), when the screen loads, then `/settings` content is shown including existing sign-out; chrome AccountMenu is not required for that path.
- Given the learner navigates to **lesson detail, player, or results**, when those screens are shown, then the bottom tab bar is **not** visible.
- Given the learner is on My lessons, New lesson, or Settings (tab surfaces), when the tab bar renders, then the matching tab is the active/selected tab for assistive tech and visuals.
- Given this ships, when mobile/narrow chrome is used, then MVP **`MobileBar`** is no longer the product nav; primary nav is NativeTabs (or DesktopBar on wide web only).

## Notes
- Related: shipped `navigation-menus` (done) — this story supersedes its mobile pattern; DesktopBar retained.
- Impl hint: `(app)/_layout` Stack → `(tabs)` NativeTabs + `lesson/[id]/*` siblings; web layout switches DesktopBar+Slot vs NativeTabs at 768.
- Open for `spec_partner`: exact tab labels/icons (SF Symbols / Material); whether DesktopBar avatar/account menu stays as-is on wide web or is trimmed now that Settings is tab-only on other surfaces; cleanup of unused `MobileBar` / `AccountMenu` exports vs leave presentational for Storybook.
- No analytics event or feature flag for this story.
- Ready for `/ticket-orchestrator native-bottom-tabs`.
