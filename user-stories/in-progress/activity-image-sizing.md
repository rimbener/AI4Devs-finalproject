# Activity image sizing + fullscreen

**As a** learner
**I want** lesson activity images capped at a readable max width, with a way to open them fullscreen
**so that** large images don't break the activity layout and I can still inspect details.

## Context
Slide images in lesson activities currently scale to full container width (`width: 100%`), which makes large images overwhelm the slide and break activity UI. Images live in `SlideImage` (activities lib) and appear on instructional/activity slides in the lesson player.

## Acceptance criteria
- Given a slide with an image, when it renders, the image is at most 700px wide (and still scales down on narrower viewports).
- Given a slide with an image, when I see the image, there is a control to view it fullscreen.
- Given I open the fullscreen image view, when it opens, I see the image larger / full screen and can dismiss it to return to the activity.
- Given a slide with no image, when it renders, layout is unchanged (no empty fullscreen control).

## Notes
- Max width: 700px.
- Touch/web: fullscreen control must work on web + native where the player runs.
- Related: `libs/activities` `SlideImage`, lesson player slide view.
