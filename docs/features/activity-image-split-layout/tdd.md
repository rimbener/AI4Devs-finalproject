# TDD — activity-image-split-layout

## Slice 1

| Scenario | Test | File |
| --- | --- | --- |
| @s2 | contains split images within the available pane height without a width cap | `libs/activities/src/organisms/slide-image/slide-image.test.tsx` |
| @s2 | SplitImage opens the lightbox from the bounded pane | `libs/activities/tests/e2e/organisms/slide-image/slide-image.e2e.js` |
| @s14 | caps and centers the image with its expand overlay at the readable content width | `libs/activities/src/organisms/slide-image/slide-image.test.tsx` |

- @s2 RED→GREEN: added the split sizing test, then added the optional layout variant.
- @s2 RED→GREEN: added the split Storybook e2e, then added its bounded-pane story.
- @s14 REFACTOR: retained the existing stacked sizing branch as the default.
- @s2 REVIEW: expanded the split e2e to open and verify the lightbox.

## Slice 2

| Scenario | Test | File |
| --- | --- | --- |
| @s4, @s5, @s6, @s8, @s9, @s10, @s11 | `useSlideLayout` split decision cases | `libs/activities/src/organisms/slide-view/use-slide-layout.test.ts` |
| @s1, @s2, @s3, @s6, @s7, @s12, @s14 | `SlideView` split and stacked structure | `libs/activities/src/organisms/slide-view/slide-view.test.tsx` |
| @s1 | `SlideView layout integration` | `libs/activities/src/organisms/slide-view/slide-view.integration.test.tsx` |

- @s1 RED→GREEN: added portrait/landscape hook coverage, then derived explicit split conditions.
- @s4–@s10 REFACTOR: added orientation, dimensions, and measured-height regression cases.
- @s1–@s3 RED→GREEN: added split row test, then rendered 50/50 image/body panes with nested body scroller.
- @s6, @s7, @s12, @s14 REFACTOR: verified stacked fallback, text-only fallback, and source order.
- @s12 REVIEW RED→GREEN: asserted the named, focusable body scroll pane and image-before-body tree order, then added the localized accessibility contract.
- REVIEW REFACTOR: moved the instructional-slide discriminator into `slide-view.helpers.ts`.
- @s1 REVIEW RED→GREEN: rendered `SlideView` with the real layout hook and mocked landscape viewport.

## Slice 3

| Scenario | Test | File |
| --- | --- | --- |
| @s8, @s13 | passes measured player body height to SlideView | `libs/activities/src/organisms/lesson-player/lesson-player.test.tsx` |
| @s11 | renders every content kind in the split wrapper | `libs/activities/src/organisms/slide-view/slide-view.test.tsx` |
| @s1, @s3, @s10, @s12 | split stories and narrow-viewport Playwright coverage | `libs/activities/tests/e2e/organisms/slide-view/slide-view.e2e.js` |

- @s8/@s13 RED→GREEN: added the player height assertion, then measured the body frame in `useLayoutEffect` and passed the positive height to content slides.
- @s11 REFACTOR: added portrait-image split stories and shared-wrapper coverage for every slide kind.
- @s1/@s3/@s10/@s12 RED→GREEN: added Storybook e2e for panes, source order, all kinds, and portrait fallback; serialized it because its Storybook URL mock is shared.
- @s8/@s13 REVIEW RED→GREEN: isolated the body ref measurement mock, asserted pre-measure `undefined`, post-measure height, and preserved SlideView's mount ref.
- REVIEW r1 RED→GREEN: CI's `WithImage` lightbox locator timed out while the shared Storybook URL mock was susceptible to parallel stories; serialized the SlideImage e2e file and verified its 2 tests, SlideView's 10 e2e tests, and both affected unit files green.
- @s2 REVIEW r3 RED→GREEN: added a measured-pane portrait-frame test that fails when rendered image dimensions exceed pane bounds, then measured the split pane and calculated contained image dimensions.
- @s2/@s13 REVIEW r3 RED→GREEN: asserted the split row consumes residual root space rather than the full body-frame height, then bounded the split root and made its row flex into title/gap-reserved space.
