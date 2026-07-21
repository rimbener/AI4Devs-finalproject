# Activity image split layout

**As a** learner
**I want** portrait slide images to sit beside the slide body on wide screens
**so that** tall images don’t push the activity down and I can see image + interaction together.

## Context
Today every slide image stacks above the body in `SlideImage` / `SlideView` (activities lib), for instructional and all activity types. Portrait images keep their aspect ratio and can dominate vertical space before the interactive part. Builds on done activity-image-sizing (max width + fullscreen lightbox). PRD asks images to render “alongside” content; this story makes that a real side-by-side layout when orientation and viewport allow.

## Acceptance criteria
- Given a slide with a portrait image (height > width) and a viewport wider than it is tall (tablet/desktop), when the slide renders, the title is full-width on top and under it the content row is ~50/50: image left, body/activity right.
- Given that split layout, when the image is shown, it uses `contain` inside its half (no crop) and the expand/fullscreen control still works as today.
- Given that split layout and a body taller than the image pane, when I scroll, the right pane scrolls independently and the left image stays visible.
- Given a landscape or square image, when the slide renders, layout stays stacked (image above body), same as today.
- Given a portrait image on a narrow or portrait viewport (phone), when the slide renders, layout stays stacked (image above body).
- Given a slide with no image, when it renders, layout is unchanged.
- Given any slide kind with an image (instructional, multiple choice, fill-in-the-blank, flashcard, matching, open-ended), when the conditions above apply, the same layout rules are used.

## Notes
- Split only when both: image is portrait AND viewport width > height.
- Related: `libs/activities` `SlideView`, `SlideImage`; done story `activity-image-sizing`.
- Lightbox behavior unchanged; this story is layout only.
