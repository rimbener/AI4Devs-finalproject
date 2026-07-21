---
id: task-3
title: SlideView renders the split row (title + 50/50 + right-pane scroller)
slice: 2
scenarios: [s1, s2, s3, s6, s7, s12, s14]
status: todo
paths:
  - libs/activities/src/organisms/slide-view/slide-view.tsx
  - libs/activities/src/organisms/slide-view/slide-view.types.ts
  - libs/activities/src/organisms/slide-view/slide-view.stories.tsx
  - libs/activities/src/organisms/slide-view/slide-view.test.tsx
---

## Goal
Make `SlideView` branch on `useSlideLayout(...).isSplit` and accept an `availableHeight` prop (fed by the player in task-4). Keep the presentational contract; only the image↔body arrangement changes.

- **Stacked (`isSplit === false`, the default/fallback):** exactly today's column — `title` → `<SlideImage layout="stacked" />` → body. Unchanged (`@s14`, `@s6`, `@s7`).
- **Split (`isSplit === true`):** `title` **full-width on top**, then a content **row** beneath:
  - **Left column** (`flex:1`): `<SlideImage layout="split" />`, not inside the body's scroller.
  - **Right column** (`flex:1`): the body/activity inside its **own `ScrollView`** (Q2=(B) nested right-pane scroller; best-effort sticky image).
  - `gap: theme.layout.gutter` (16) between the two columns (Q7=(A), strict 50/50).
  - The row is bounded to `availableHeight` so the image height-bound and the right-pane scroller resolve.
- **Source/reading + focus order stays `title → image → body`** in both modes (`@s12`): the image column precedes the body column in the tree; the right pane is keyboard-scrollable.
- No image → no image column, layout unchanged (`@s7`).

## Done criteria
- [ ] `SlideViewProps` gains `availableHeight?: number | null` (passed through to `useSlideLayout`)
- [ ] `@s1` — portrait image + landscape + measured height → full-width title + `[image | body]` row, columns ~50/50 (`flex:1`/`flex:1`) with a `gutter` gap
- [ ] `@s2` — split image is rendered via `SlideImage layout="split"` (contain, height-bounded) with the expand control present
- [ ] `@s3` — the body sits in its own `ScrollView`; the image column is a sibling outside that scroller (assert structure, not pixel-stickiness)
- [ ] `@s6`, `@s7`, `@s14` — stacked fallback (portrait+portrait viewport, no image, and stacked image sizing) unchanged; existing `slide-view.test.tsx` stays green
- [ ] `@s12` — DOM/reading order is title → image → body in the split tree
- [ ] Storybook `Split*` story renders a portrait-image slide in a bounded wide container
- [ ] `pnpm lint` + `pnpm check-types` green; tokens only

## Notes
`SlideView` composes the mode via the hook (task-2) and passes `layout` to `SlideImage` (task-1). Styles in `StyleSheet.create`. Split branching applies identically to instructional + all 5 activity bodies (the branch wraps whatever `ActivityBody`/content `SlideView` already routes to) — full all-kinds coverage lands in task-5.
