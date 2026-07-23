# TDD log — native-bottom-tabs

## @s → test map

| @s | test file | test name |
|---|---|---|
| @s1 | native-tabs-triggers.test.ts + tabs-layout.test.ts | NATIVE_TAB_TRIGGERS index+settings; both layouts import it |
| @s2 | tabs-layout-web.test.tsx | mobile NativeTabs; no AppChrome; no mobile-top/bottom-bar |
| @s3 | desktop-bar.test.tsx / app-chrome.test.tsx / tabs-layout-web.test.tsx | My lessons only; no New lesson; desktop AppChrome+Slot |
| @s4 | native-tabs-triggers.test.ts | two triggers index + settings |
| @s5 | tabs-layout.native.test.tsx | Trigger accessibilityState.selected on real NativeTabs path |
| @s6 | saved-lessons.test.tsx | New Lesson CTA content+empty → push('/upload'); label nav.newLesson |
| @s7 | tabs-layout.test.ts + app-layout-settings.test.ts | upload sibling + header; unstable_settings → / |
| @s8 | tabs-layout.test.ts | upload Stack sibling (My lessons stays selected) |
| @s9 | tabs-layout.test.ts | lesson routes Stack siblings |
| @s10 | native-tabs-triggers.test.ts + tabs-layout.test.ts | nav keys + glyphs; both layouts share contract |
| @s11 | app-chrome.test.tsx | Settings via AccountMenu; not a bar item |
| @s12 | app-chrome.test.tsx | Sign out via AccountMenu confirm flow |
| @s13 | settings-sign-out.test.tsx | mobile renders uncontrolled SignOut + confirm |
| @s14 | settings-sign-out.test.tsx | desktop renders null |
| @s15 | tabs-layout-web.test.tsx | breakpoint → NativeTabs or AppChrome+Slot |
| @s16 | tabs-layout.test.ts + app-layout-settings.test.ts | groupless tabs; deep-link back → (tabs)/ |
| @s17 | mobile-bar-retired.test.ts | no MobileBar export/folder/e2e; AccountMenu remains |
| slice2 | slice-2.integration.test.tsx | CTA + desktop chrome + mobile Settings SignOut |
| slice3 | mobile-bar-retired.test.ts | AppChrome keeps AccountMenu; no MobileBar import |

## Red→Green cycles

### Slices 1–3 (committed)
- Task-1…6 + reviewer_slice — see git history

### Full-review rework (uncommitted)
- @s5 RED→GREEN: drop dead `isNativeTabSelected`; assert selected on native `_layout` Triggers
- @s7/@s16 RED→GREEN: `unstable_settings.initialRouteName: '(tabs)'` + runtime export assert
- minor: extract `NATIVE_TAB_TRIGGERS`; both layouts consume it; assert native+web
- minor: move structure suite → `apps/app-study-buddy/src/__tests__/…` (+ `@types/node`)

### Full-review rework r2 (CI)
- localization RED→GREEN: ignore `sf:` SF Symbol glyphs in dotted-key scanner (`books.vertical` ≠ `t()` key)

## Gate
- study-buddy: 256 tests; app: 29; lint + check-types clean on both
- localization migration-coverage green (app-chrome)
