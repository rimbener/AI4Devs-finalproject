# TDD log — native-bottom-tabs Slice 1

## @s → test map

| @s | test file | test name |
|---|---|---|
| @s1 | libs/study-buddy/src/components/app-chrome/tabs-layout.test.ts | registers exactly two triggers: index and settings — no upload/newLesson |
| @s4 | libs/study-buddy/src/components/app-chrome/tabs-layout.test.ts | registers exactly two triggers: index and settings — no upload/newLesson |
| @s5 | libs/study-buddy/src/components/app-chrome/native-tab-selected.test.ts | exposes accessibilityState.selected shape for the active route |
| @s7 | tabs-layout.test.ts | upload screen has headerShown: true; upload title from nav.newLesson |
| @s8 | libs/study-buddy/src/components/app-chrome/tabs-layout.test.ts | lists upload as a Stack sibling — not inside (tabs) — so no tab bar (@s7 @s9) |
| @s9 | tabs-layout.test.ts | lesson routes are Stack siblings so tab bar absent |
| @s10 | tabs-layout.test.ts | nav.myLessons/nav.settings locale keys; books.vertical/menu_book/gearshape glyphs; no hardcoded labels |
| @s16 | tabs-layout.test.ts | (tabs) dir exists; (app)/index.tsx + settings.tsx deleted; (tabs)/index.tsx + settings.tsx present |
| @s2 | apps/app-study-buddy/src/__tests__/app/(app)/(tabs)/tabs-layout-web.test.tsx | mobile (<768) renders NativeTabs, no AppChrome |
| @s3 | tabs-layout-web.test.tsx | desktop (≥768) renders AppChrome + Slot, no NativeTabs |
| @s15 | tabs-layout-web.test.tsx | breakpoint → NativeTabs (mobile) or AppChrome+Slot (desktop) |

## Red→Green cycles

### Task-1 (s1,s4,s5,s7,s8,s9,s10,s16)
- RED: 15 tests failed (files didn't exist)
- GREEN: created (tabs)/_layout.tsx (NativeTabs, 2 triggers), (tabs)/index.tsx, (tabs)/settings.tsx; updated (app)/_layout.tsx (Stack with (tabs)+upload+lesson siblings, headerShown:true on upload); deleted (app)/index.tsx + settings.tsx; updated app-shell.test.ts paths
- 15/15 passed

### Task-2 (s2,s3,s15)
- RED: test failed (module not found)
- GREEN: created (tabs)/_layout.web.tsx (useBreakpoint branches desktop→AppChrome+Slot, mobile→NativeTabs); fixed Label mock to wrap in Text
- 6/6 passed

### Slice-1 reviewer_slice rework (F1–F3)
- RED @s5: native-tab-selected.test.ts failed (module missing)
- GREEN: isNativeTabSelected helper (route→AT selected); tdd.md @s4/@s5/@s8 mapped; restored ApiKeyProvider+ProfileProvider why-comment
- 3/3 helper tests passed

## Slice gate
- app-study-buddy: 8/8 tests, lint clean, tsc clean
- @helsoft/study-buddy: 269+15=284 tests, app-chrome/ lint clean, tsc clean
