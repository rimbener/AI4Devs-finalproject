# Native bottom tabs navigation

**As a** signed-in learner
**I want** system-native bottom tabs on iOS/Android, a Material-style bottom tab bar on narrow web, and the existing desktop top bar on wide web
**so that** primary navigation feels platform-native and I can reach My lessons and Settings without the MVP custom chrome

## Context
- Replaces the MVP `navigation-menus` chrome for mobile/narrow viewports: custom `MobileBar` + mobile `AppChrome` account menu were a quick design, not the target UX.
- **iOS/Android:** Expo Router **`NativeTabs`** (`expo-router/unstable-native-tabs`).
- **Web &lt; 768:** **`WebBottomTabs`** organism in `@helsoft/components` (headless `expo-router/ui` + Material bottom bar). NativeTabs web chrome sits at the top — not used on web.
- **Web ≥ 768:** existing **`DesktopBar`** via desktop-only `AppChrome` (brand + My lessons + alerts placeholder + avatar/`AccountMenu` — **no** New lesson or Settings nav items in the bar).
- Primary tabs (**2**): **My lessons** → `/`, **Settings** → `/settings`. **New Lesson** is a CTA on My lessons → `push('/upload')`, not a tab.
- `/upload` + lesson flows (`/lesson/[id]/*`) are Stack siblings of `(tabs)` — immersive (no tab bar).
- Sign out: `AccountMenu` on wide web; Settings screen `SignOut` when `breakpoint === 'mobile'`.
- Shared trigger contract: `NATIVE_TAB_TRIGGERS` in `@helsoft/study-buddy` (labels + sf/md glyphs + hrefs); web maps into `WebBottomTabs` `triggers` prop.
- Breakpoint **768** via `useBreakpoint`.

## Acceptance criteria
- Given a signed-in learner on **iOS or Android**, when the authenticated shell renders, then they see **NativeTabs** with My lessons + Settings (no New lesson tab).
- Given a signed-in learner on **web width &lt; 768**, when the shell renders, then they see **WebBottomTabs** Material bottom bar with the same two destinations (not `MobileBar`, not NativeTabs top chrome).
- Given a signed-in learner on **web width ≥ 768**, when the shell renders, then they see **DesktopBar** (My lessons only in nav; Settings via AccountMenu) and **no** bottom tab bar.
- Given the learner activates **New Lesson** on My lessons (content or empty), then they navigate to `/upload` immersively with header/back; My lessons stays the selected tab.
- Given the learner navigates to **lesson detail, player, or results**, then the bottom tab bar is **not** visible.
- Given this ships, then MVP **`MobileBar`** is removed from `@helsoft/components`; `AccountMenu` remains for the desktop avatar.

## Notes
- Related: shipped `navigation-menus` (done) — this story supersedes its mobile pattern; DesktopBar retained (trimmed).
- Contract: `docs/features/native-bottom-tabs/` (spec + gherkin @s1–@s17).
- No analytics event or feature flag for this story.
