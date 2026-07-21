# Risks — activity-image-split-layout

## Technical
- **R1 — Best-effort sticky / independent scroll (Q2=(B)).** The right-pane `ScrollView` is nested inside `LessonPlayer`'s existing outer `ScrollView`; true pixel-stickiness of the image is not guaranteed. *Mitigation:* gherkin asserts **structure** (separate scroller + separate image column), not pixel position; documented as accepted tradeoff. Escalate to Q2-A (swap the outer wrapper) only if UX proves unacceptable.
- **R2 — Nested vertical `ScrollView` gesture conflict on native.** iOS/Android may fight between outer and inner vertical scrollers. *Mitigation:* split only triggers in landscape where the row fills the pane (little outer overflow); primary target is web; flag for the reviewer/native QA.
- **R3 — `ref.measure()` timing on old-arch native.** `measure()` is async (callback) on the old architecture; first paint has `availableHeight` undefined. *Mitigation:* explicit `availableHeight` undefined → **stacked** guard (@s8); re-measure on layout; never assume a synchronous value.
- **R4 — Approximate/relayout on rapid resize.** Continuous window resizing re-measures and re-renders. *Mitigation:* derivation is cheap/pure; `useWindowDimensions` + `useLayoutEffect` already debounce to layout commits; no manual listeners.
- **R5 — Split image with unknown/degenerate dims.** Missing or non-positive `width`/`height` could mis-trigger split or a 0-height image. *Mitigation:* `useSlideLayout` returns `false` unless both dims > 0 and portrait (@s9).

## Product
- **R6 — AC #5 wording vs orientation-only rule.** A landscape phone (`width > height`) splits under Q3=(A), which the story's "(phone)" parenthetical could read against. *Mitigation:* human-locked Q3=(A); AC #5 scoped to portrait/narrow-portrait viewports in the spec; landscape phone splitting is intended (real horizontal room).
- **R7 — Chrome-offset not needed (superseded).** Earlier window-minus-chrome idea (Q5=A) was dropped for measured height (Q5=B); no magic offset constant to drift. No action.

## Timeline / dependency
- **R8 — Builds on done `activity-image-sizing`.** Depends on the shipped `SlideImage` expand/lightbox + `contentReading` cap. State: **done** on this branch (`feat/activity-image-split-layout` from `feature-entrega3`). Additive prop only; low risk.
- **R9 — Cross-layer touch (`LessonPlayer`).** Slice 3 edits `LessonPlayer` (height plumbing) beyond `SlideView`. *Mitigation:* isolated to adding a ref + `availableHeight` state + prop pass-through; existing player states/tests must stay green.
