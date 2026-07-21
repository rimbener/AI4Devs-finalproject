---
id: task-5
title: All-kinds coverage, a11y order, Storybook + Playwright e2e
slice: 3
scenarios: [s1, s3, s7, s10, s11, s12]
status: todo
paths:
  - libs/activities/src/organisms/slide-view/slide-view.stories.tsx
  - libs/activities/src/organisms/slide-view/slide-view.test.tsx
  - libs/activities/tests/e2e/organisms/slide-view/slide-view.e2e.js
---

## Goal
Lock the behavior across every slide kind and prove it in a real browser. No new source logic — coverage + stories + e2e over tasks 1–4.

- Storybook: split stories for instructional + all 5 activity kinds (portrait image, wide bounded container), plus a stacked-portrait (narrow) story and a no-image story for contrast.
- e2e (Playwright, per `storybook-e2e-tests` skill): render the split story and assert the `[image | body]` row structure, the body-pane scroller, expand control presence, and that a portrait-on-narrow story renders stacked.

## Done criteria
- [ ] `@s11` — split renders for instructional, multiple-choice, fill-in-the-blank, flashcard, matching, open-ended (portrait image + landscape + measured height)
- [ ] `@s1`, `@s3` — split story shows full-width title + 50/50 row; body pane is its own scroller with the image column beside it
- [ ] `@s7` — no-image story is unchanged (no image column)
- [ ] `@s10` — a resize/orientation story (or e2e viewport resize) shows stacked↔split switching
- [ ] `@s12` — reading/focus order title → image → body verified in the rendered story
- [ ] Playwright e2e added and green per lib convention; `pnpm lint` + `pnpm check-types` green

## Notes
Follow the existing `matching.stories.tsx` / `*.e2e.js` patterns in `libs/activities`. Stories must set a bounded-height wide decorator so `availableHeight` measures > 0 and split actually engages.
