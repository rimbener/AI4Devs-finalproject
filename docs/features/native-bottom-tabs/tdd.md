# TDD log — native-bottom-tabs

## @s → test map

| @s | test file | test name |
|---|---|---|
| @s1 | tabs-layout.test.ts | registers exactly two triggers: index and settings — no upload/newLesson |
| @s2 | tabs-layout-web.test.tsx | mobile (<768) renders NativeTabs, no AppChrome |
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
| slice2 | slice-2.integration.test.tsx | CTA + desktop chrome + mobile Settings SignOut |

## Red→Green cycles

### Slice 1 (committed)
- Task-1/2 + reviewer_slice F1–F3 — see git history

### Slice 2 — Task-3 (@s6)
- RED: SavedLessons CTA content/empty → missing button
- GREEN: header `Button` + `t('nav.newLesson')` → `router.push('/upload')`; stories + e2e
- 16/16 saved-lessons tests

### Slice 2 — Task-4 (@s3,@s11,@s12)
- RED: DesktopBar exactly 1 link (had 2); AppChrome tests expect no MobileBar/newLesson
- GREEN: drop `newLesson` prop; AppChrome desktop-only; delete getMobileTitleKey helpers; e2e
- DesktopBar 4/4; AppChrome+hook 10/10

### Slice 2 — Task-5 (@s13,@s14)
- RED: settings-sign-out module missing
- GREEN: SettingsSignOut gates on useBreakpoint; wire (tabs)/settings; barrel; stories + e2e; slice-2 integration
- settings-sign-out 2/2; integration 1/1

## Slice gate
- @helsoft/study-buddy: 272 tests; check-types clean; biome clean on slice paths (pre-existing format noise in new-lesson-dialog.tsx)
- @helsoft/components desktop-bar: 4/4 tests; biome clean; e2e 2/2
- app-study-buddy: 8/8 tests; check-types clean
- study-buddy e2e (saved-lessons + app-chrome + settings-sign-out): 10/10
- tdd.md ~2.4KB
