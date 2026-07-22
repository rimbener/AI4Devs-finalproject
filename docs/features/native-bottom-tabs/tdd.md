# TDD log — native-bottom-tabs

## @s → test map

| @s | test file | test name |
|---|---|---|
| @s1 | tabs-layout.test.ts | registers exactly two triggers: index and settings — no upload/newLesson |
| @s2 | tabs-layout-web.test.tsx | mobile NativeTabs; no AppChrome; no mobile-top/bottom-bar |
| @s3 | desktop-bar.test.tsx / app-chrome.test.tsx / tabs-layout-web.test.tsx | My lessons only; no New lesson; desktop AppChrome+Slot |
| @s4 | tabs-layout.test.ts | two triggers index + settings |
| @s5 | native-tab-selected.test.ts | accessibilityState.selected for active route |
| @s6 | saved-lessons.test.tsx | New Lesson CTA content+empty → push('/upload'); label nav.newLesson |
| @s7 | tabs-layout.test.ts | upload Stack sibling + headerShown; title nav.newLesson |
| @s8 | tabs-layout.test.ts | upload Stack sibling (My lessons stays selected) |
| @s9 | tabs-layout.test.ts | lesson routes Stack siblings |
| @s10 | tabs-layout.test.ts | nav.myLessons/nav.settings + glyphs; no newLesson tab |
| @s11 | app-chrome.test.tsx | Settings via AccountMenu; not a bar item |
| @s12 | app-chrome.test.tsx | Sign out via AccountMenu confirm flow |
| @s13 | settings-sign-out.test.tsx | mobile renders uncontrolled SignOut + confirm |
| @s14 | settings-sign-out.test.tsx | desktop renders null |
| @s15 | tabs-layout-web.test.tsx | breakpoint → NativeTabs or AppChrome+Slot |
| @s16 | tabs-layout.test.ts | (tabs) groupless; old index/settings deleted |
| @s17 | mobile-bar-retired.test.ts | no MobileBar export/folder/e2e; AccountMenu remains |
| slice2 | slice-2.integration.test.tsx | CTA + desktop chrome + mobile Settings SignOut |
| slice3 | mobile-bar-retired.test.ts | AppChrome keeps AccountMenu; no MobileBar import |

## Red→Green cycles

### Slice 1 (committed)
- Task-1/2 + reviewer_slice F1–F3 — see git history

### Slice 2 (committed)
- Task-3/4/5 — CTA, desktop-only AppChrome, SettingsSignOut — see git history

### Slice 3 — Task-6 (@s2,@s17)
- RED: mobile-bar-retired — barrel still exported MobileBar; folder+e2e existed
- GREEN: drop organisms export; delete `mobile-bar/` + e2e; AccountMenu untouched
- @s2: tabs-layout-web asserts no mobile-top/bottom-bar
- 3/3 retired; components 344; app 9; e2e 144 (no mobile-bar)

## Slice gate
- @helsoft/components: 344 tests; check-types clean; biome clean on slice paths
- components playwright: 144/144 (mobile-bar e2e gone)
- app-study-buddy: 9/9; check-types clean
- tdd.md ~2.7KB
