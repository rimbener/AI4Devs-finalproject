# Engineering review — native-bottom-tabs

**Verdict:** CHANGES_REQUESTED  
**CI:** green @ `1043d827d57af2838e3eece620747b01ce0b7443`  
**Base:** `feature-entrega3-HernanLaura`

## Lenses N/A

None. Diff ships UI/nav chrome + `SettingsSignOut` (auth session UX) — both performance and security in scope; no findings under those lenses beyond the items below.

## Findings

1. **major [code]** `libs/study-buddy/src/components/app-chrome/native-tab-selected.ts:8` (+ barrel `libs/study-buddy/src/index.ts:8-9`) — `isNativeTabSelected` is dead production code (zero call sites outside its unit test). `@s5` is asserted only against this unused helper (`native-tab-selected.test.ts:6-22`), not against `NativeTabs` wiring in `(tabs)/_layout.tsx` / `_layout.web.tsx`. Violates YAGNI / “no production code that no test demands”; leaves AT-selected tab contract unproven on the real path. Drop the export (and helper) or wire selection into production; cover `@s5` against the actual selected path Expo owns (or an integration that observes it).

2. **major [code]** `apps/app-study-buddy/src/app/(app)/_layout.tsx:13-15` — `@s7` / `@s16` require a header back from a **directly opened** `/upload` that returns to My lessons. Layout only sets `headerShown: true` + title; no `unstable_settings.initialRouteName: '(tabs)'` (or equivalent stack anchor). Expo Router docs: deep links into a stack need `initialRouteName` for a consistent back stack. Tests only regex `headerShown` (`tabs-layout.test.ts:58-61`) — do not prove destination `/`. Add the settings (or explicit back → `/`) and a concrete test for deep-link back → My lessons.

3. **minor [code]** `apps/app-study-buddy/src/app/(app)/(tabs)/_layout.tsx:8-17` vs `_layout.web.tsx:20-30` — duplicated NativeTabs trigger trees (labels, glyphs, names). `tabs-layout.test.ts` locks only the native file for `@s1`/`@s10`; web layout can drift (wrong glyph/key/extra trigger) without failing those checks. Extract shared trigger config or assert both files.

4. **minor [arch]** `libs/study-buddy/src/components/app-chrome/tabs-layout.test.ts:4-7` — feature-lib suite reads `apps/app-study-buddy` sources via `../../../../../apps/...`. Cross-package filesystem coupling; prefer co-located app tests (as with `tabs-layout-web.test.tsx`) or a shared contract module in `@helsoft/study-buddy` that the app imports.
