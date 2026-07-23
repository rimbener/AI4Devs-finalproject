# Engineering review — native-bottom-tabs (round 2)

**Verdict:** APPROVED  
**CI:** green @ `c6b3b3619b467a1b44cad12e579a7b25e076de1b`  
**Base:** `feature-entrega3-HernanLaura`

## Lenses N/A

- **performance:** UI/nav chrome only (2-tab `NativeTabs` / `WebBottomTabs`, breakpoint switch, no lists/queries). No findings.
- **security:** No new service/DAO/network/storage trust boundary; SignOut reposition only; no secrets. No findings. (OWASP: N/A)

## Prior r1 findings — verified resolved

1. **major [code]** Dead `isNativeTabSelected` removed (no remaining refs). `@s5` → `tabs-layout.native.test.tsx` renders real `(tabs)/_layout.tsx` and asserts Trigger `accessibilityState.selected` (mock mirrors Expo name↔route selection).
2. **major [code]** `(app)/_layout.tsx:7-9` exports `unstable_settings.initialRouteName: '(tabs)'`; concrete assert in `app-layout-settings.test.ts:24-26` + source check in `tabs-layout.test.ts:68-79`.
3. **minor [code]** Shared `NATIVE_TAB_TRIGGERS` (`native-tabs-triggers.ts`); native `_layout.tsx` consumes it; web `_layout.web.tsx` maps it into `WebBottomTabs` `triggers`; asserted in `tabs-layout.test.ts` + `tabs-layout-web.test.tsx`.
4. **minor [arch]** Structure suite moved to `apps/app-study-buddy/src/__tests__/app/(app)/tabs-layout.test.ts` (gone from study-buddy lib).

## Findings

None.

## Post-review follow-up (docs/code aligned)
Narrow web: `WebBottomTabs` organism + `WebBottomTabButton` molecule in `@helsoft/components` (stories/Jest/e2e); `expo-router` peer for `expo-router/ui`.
