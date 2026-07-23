# Native bottom tabs navigation

**As a** signed-in learner
**I want** system-native bottom tabs on iOS/Android, a Material-style bottom tab bar on narrow web, and the existing desktop top bar on wide web
**so that** primary navigation feels platform-native and I can reach My lessons, My PDF files, and Settings without the MVP custom chrome

## Context
- Replaces the MVP `navigation-menus` chrome for mobile/narrow viewports.
- **iOS/Android:** Expo Router **`NativeTabs`** (`expo-router/unstable-native-tabs`).
- **Web &lt; 768:** **`WebBottomTabs`** (`@helsoft/components` + `expo-router/ui`). NativeTabs web chrome not used.
- **Web ≥ 768:** **`DesktopBar`** via desktop-only `AppChrome` — brand + **My lessons** + **My PDF files** + alerts placeholder + avatar/`AccountMenu` (Settings + Sign out). No New lesson bar item.
- Primary tabs (**3**): **My lessons** → `/`, **My PDF files** → `/pdf-files`, **Settings** → `/settings`.
- **New Lesson** CTA on My lessons → `push('/pdf-files')` (not a tab; no `/upload` route). Upload/generate lives in self-contained **`PdfDocuments`** on the PDF files screen.
- Lesson flows (`/lesson/[id]/*`) are Stack siblings of `(tabs)` — immersive (no tab bar).
- Sign out: `AccountMenu` on wide web; Settings screen when `breakpoint === 'mobile'`.
- Shared contract: `NATIVE_TAB_TRIGGERS` in `@helsoft/study-buddy`.

## Acceptance criteria
- Native: **NativeTabs** with My lessons + My PDF files + Settings.
- Narrow web: **WebBottomTabs** with the same three destinations (not `MobileBar`).
- Wide web: **DesktopBar** with My lessons + My PDF files; Settings via AccountMenu; no bottom tab bar.
- New Lesson on My lessons (content or empty) → `/pdf-files`.
- Lesson detail/player/results: no bottom tab bar.
- **`MobileBar`** removed from `@helsoft/components`; `AccountMenu` remains.

## Notes
- Contract: `docs/features/native-bottom-tabs/` (spec + gherkin @s1–@s17).
- No analytics event or feature flag.
