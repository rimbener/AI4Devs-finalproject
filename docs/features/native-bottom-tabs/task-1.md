---
id: task-1
title: Route restructure + native 3-tab layout
slice: 1
scenarios: [s1, s5, s7, s8, s9, s10, s16]
status: done
paths:
  [
    apps/app-study-buddy/src/app/(app)/_layout.tsx,
    apps/app-study-buddy/src/app/(app)/(tabs)/_layout.tsx,
    apps/app-study-buddy/src/app/(app)/(tabs)/index.tsx,
    apps/app-study-buddy/src/app/(app)/(tabs)/pdf-files.tsx,
    apps/app-study-buddy/src/app/(app)/(tabs)/settings.tsx,
    libs/study-buddy/src/components/app-chrome/native-tabs-triggers.ts,
  ]
---

## Goal
Restructure `(app)` so `_layout.tsx` is a `Stack` whose children are a **`(tabs)` group** (`index`, `pdf-files`, `settings`) plus **`lesson/[id]/*` as siblings**. Native `(tabs)/_layout.tsx` = `NativeTabs` with **three** triggers from `NATIVE_TAB_TRIGGERS`. No `/upload` Stack screen — PDF upload/generate lives on the PDF files tab. `(tabs)` is groupless so URLs stay `/`, `/pdf-files`, `/settings`.

## Done criteria
- [x] Native `(tabs)/_layout.tsx` renders `NativeTabs` with index, pdf-files, settings (s1, s10)
- [x] `lesson/[id]/*` are Stack siblings of `(tabs)` → no tab bar (s9)
- [x] No `upload` Stack screen / `upload.tsx` (s7, s16)
- [x] Correct route → selected tab; New Lesson → `/pdf-files` selects PDF files (s5, s8)
- [x] URLs: `/`, `/pdf-files`, `/settings`, `/lesson/[id]...` (s16)
- [x] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
- Web layout is **task-2**. New Lesson CTA retarget is **task-3** (amended → `/pdf-files`).
