---
id: task-1
title: Route restructure + native 2-tab layout + immersive upload
slice: 1
scenarios: [s1, s4, s5, s7, s8, s9, s10, s16]
status: done
paths:
  [
    apps/app-study-buddy/src/app/(app)/_layout.tsx,
    apps/app-study-buddy/src/app/(app)/(tabs)/_layout.tsx,
    apps/app-study-buddy/src/app/(app)/(tabs)/index.tsx,
    apps/app-study-buddy/src/app/(app)/(tabs)/settings.tsx,
    apps/app-study-buddy/src/app/(app)/index.tsx,
    apps/app-study-buddy/src/app/(app)/settings.tsx,
    apps/app-study-buddy/src/app/(app)/upload.tsx,
  ]
---

## Goal
Restructure `(app)` so `_layout.tsx` is a `Stack` whose children are a new **`(tabs)` group** (holding **only** `index` → My lessons and `settings` → Settings) plus **`upload` and `lesson/[id]/*` as siblings** of `(tabs)`. Add the **native** `(tabs)/_layout.tsx` = `NativeTabs` (`expo-router/unstable-native-tabs`) with **two** `Trigger`s, each a `Label` (existing locale key) + `Icon` (`sf` + Material). `(tabs)` is groupless so `/` and `/settings` URLs are unchanged. Because `upload` and lesson routes live outside `(tabs)`, pushing them covers the tab bar (immersive). Give the parent `Stack` a **header (with back)** for `upload` (title `nav.newLesson`) so both an in-app push and a direct `/upload` deep link can return to My lessons; My lessons stays the selected tab throughout.

## Done criteria
- [ ] Scenario(s) s1, s4, s5, s7, s8, s9, s10, s16 covered by concrete test(s)
- [ ] Native `(tabs)/_layout.tsx` renders `NativeTabs` with exactly 2 triggers (index, settings); no New lesson tab (s1, s10)
- [ ] Tab labels reuse `nav.myLessons` / `nav.settings`; icons My lessons `sf="books.vertical"`/`menu_book`, Settings `sf="gearshape"`/`settings`; no New lesson glyph in the bar (s10)
- [ ] `upload` + `lesson/[id]/*` are Stack siblings of `(tabs)` → no tab bar on those routes (s7, s9)
- [ ] `upload` has a Stack header + back returning to `/`; direct `/upload` deep link can go back to My lessons (s7, s16)
- [ ] Correct route → active/selected tab; My lessons stays selected while `/upload` is pushed (s5, s8)
- [ ] URLs/deep links unchanged: `/`, `/upload`, `/settings`, `/lesson/[id]...` (s16)
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green
- [ ] No hardcoded strings/colors/dimensions (labels via `t()`)

## Notes
- Locks: Q1 adopt `NativeTabs`; Q2 `(tabs)` group + siblings; revision Q1 (2 tabs, `/upload` sibling) + Q4 (immersive `/upload` + header/back, My lessons stays active).
- **Delete the originals** `(app)/index.tsx` + `(app)/settings.tsx` when moving their bodies into `(tabs)/` — leaving them would register duplicate routes for `/` and `/settings` (both `(app)/index` and `(app)/(tabs)/index` resolve to `/`) and break navigation.
- `upload.tsx` stays a direct `(app)` child (moved out of the tab group).
- Web layout (≥768 desktop vs <768 tabs) is **task-2** (`(tabs)/_layout.web.tsx`).
