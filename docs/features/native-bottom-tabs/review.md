# Review — native-bottom-tabs (round 1)

**CI green @** `1043d827d57af2838e3eece620747b01ce0b7443`  
**Lenses N/A:** none (perf + security in scope; no findings under those lenses).

## Open findings

### major

1. **[code]** `libs/study-buddy/src/components/app-chrome/native-tab-selected.ts:8` (+ barrel `libs/study-buddy/src/index.ts:8-9`) — `isNativeTabSelected` dead production code (no call sites outside unit test). `@s5` only covered via unused helper, not real `NativeTabs` path in `(tabs)/_layout.tsx` / `_layout.web.tsx`. Drop helper/export or wire into production; cover `@s5` on the path Expo owns.

2. **[code]** `apps/app-study-buddy/src/app/(app)/_layout.tsx:13-15` — `@s7`/`@s16` need deep-link `/upload` back → My lessons. Layout lacks `unstable_settings.initialRouteName: '(tabs)'` (or equiv). Tests only regex `headerShown` (`tabs-layout.test.ts:58-61`). Add stack anchor (or explicit back → `/`) + concrete deep-link back test.

### minor

3. **[code]** `apps/app-study-buddy/src/app/(app)/(tabs)/_layout.tsx:8-17` vs `_layout.web.tsx:20-30` — duplicated NativeTabs trigger trees; tests lock native only for `@s1`/`@s10`. Extract shared config or assert both files.

4. **[arch]** `libs/study-buddy/src/components/app-chrome/tabs-layout.test.ts:4-7` — feature-lib suite reads `apps/app-study-buddy` via relative path. Prefer app-colocated tests or shared contract module in `@helsoft/study-buddy`.

## Request to implementer

Fix **every** open finding via TDD (majors + minors). Re-run CI green after.
