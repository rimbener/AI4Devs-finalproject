# Risks — native-bottom-tabs

## Technical
- **Unstable API (`expo-router/unstable-native-tabs`).** Import path is flagged `unstable-`; signature can shift across SDK bumps. — *Mitigation:* isolated to native `(tabs)/_layout.tsx` only; pin/patch on SDK upgrade; no new package added (ships with `expo-router ~57.0.3`). **Human-accepted (Q1).**
- **NativeTabs web chrome is wrong.** NativeTabs on web renders a top bar, not Material bottom nav. — *Mitigation:* narrow web uses `WebBottomTabs` (`@helsoft/components` + headless `expo-router/ui`); Material glyphs via `Icon` / `WebBottomTabButton`. (amends Q3/Q4)
- **`TabList` screen discovery.** Wrapping `<TabList>` in a plain `<View>` throws "Couldn't find any screens". — *Mitigation:* `<TabList asChild>` on the Unistyles sticky bar `View`.
- **Runtime navigator swap on web resize across 768.** `_layout.web.tsx` switching `WebBottomTabs` ↔ `AppChrome`+`Slot` can remount the subtree. — *Mitigation:* rare; screen state is URL/server-driven, so no real loss. **Human-accepted (Q3).**
- **`expo-router` peerDep on `@helsoft/components`.** `WebBottomTabs` imports `expo-router/ui`. — *Mitigation:* peer + Storybook alias mock (`.storybook/mocks/expo-router-ui.tsx`); app already depends on expo-router.
- **Immersive `/upload` back path.** `/upload` is now a Stack sibling with no tab bar / no DesktopBar; a direct deep link has empty history. — *Mitigation:* parent Stack gives `/upload` a header + back that resolves to `/` (s7, s16).
- **Route restructure regressions.** Moving `index`/`settings` into `(tabs)` and `/upload` out must keep URLs/deep links identical and keep the tab bar off `/upload` + lesson routes. — *Mitigation:* `(tabs)` is groupless (no URL change); `/upload` + lesson routes are Stack siblings, so the tab bar cannot mount on them (s7, s9, s16).
- **Deleting `MobileBar` + removing `DesktopBar.newLesson`.** Lingering importers break the build. — *Mitigation:* task-4 removes wiring/prop before task-6 deletes; grep importers repo-wide; keep `AccountMenu`.

## Product
- **Single create entry.** New Lesson is now only the My lessons CTA (no tab, no DesktopBar item). — *Mitigation:* CTA persists in both content + empty states on all platforms (s6); reachable whether or not lessons exist.
- **Sign-out reachability on native/narrow.** Settings screen had no sign-out; dropping the chrome `AccountMenu` would strand it. — *Mitigation:* task-5 adds breakpoint-gated `SignOut` to Settings (s13); wide web keeps `AccountMenu` sign-out (s12, s14).

## Timeline / dependencies
- Depends on shipped `navigation-menus` (DesktopBar, AccountMenu, `useBreakpoint`, `SignOut`, `Button`, locale keys) — all present. `expo-router` peer on `@helsoft/components` for `WebBottomTabs` only. No backend, no analytics, no feature flag.
- Overrides the story's original 3-tab AC (New lesson as tab) per the human's revision — contract updated to 2 tabs + CTA.
