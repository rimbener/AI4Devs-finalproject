---
feature: activity-image-split-layout
story: user-stories/in-progress/activity-image-split-layout.md
status: approved
---

# Spec — activity-image-split-layout

## Summary
On wide (landscape) viewports a **portrait** slide image renders **beside** the body instead of stacked above it, so a tall image no longer pushes the activity down. Layout-only, presentational, in `@helsoft/activities` (`SlideView` + `SlideImage`, height plumbing from `LessonPlayer`). Builds on the done `activity-image-sizing` story (unchanged: max width + `contain` + expand/lightbox).

Behavior → [`gherkin-scenarios.md`](./gherkin-scenarios.md) (`@s1…@s14`); tasks/slices → [`tasks.md`](./tasks.md).

## User story
- As a **learner**, I want **portrait slide images to sit beside the slide body on wide screens**, so **tall images don't push the activity down and I can see the image and the interaction together**.

## UI states (`SlideView`)
| State | Trigger | Notes |
|---|---|---|
| Loading | **N/A** — URL resolution owned by `SlideImage`/`useSlideImageUrl` (unchanged). | No layout Loading UI. |
| Content — **stacked** | No image; OR landscape/square image; OR portrait image on portrait/narrow viewport; OR height not yet measured. | Today's column title → image → body. Safe default. |
| Content — **split** | Portrait (`h>w`, dims > 0) **AND** `width > height` **AND** measured `availableHeight > 0`. | Full-width title; `[image \| body]` ~50/50 (`flex:1`, `gutter` gap); image `contain`+height-bounded; body own scroller. |
| Empty / Error | No image, or URL unresolved. | `SlideImage` renders nothing (existing degrade); stays stacked, no image column. |

## Analytics events
None — purely presentational layout; nothing to instrument.

## Feature flags
None — ships unconditionally.

## Non-goals
- Changing the expand/fullscreen **lightbox** or stacked-mode image sizing (both from `activity-image-sizing`, unchanged).
- Swapping `LessonPlayer`'s outer `ScrollView` (Q2-A) — only nested right-pane scroll + height plumbing (Q2-B).
- Guaranteed pixel-**sticky** image / true independent scroll — best-effort under Q2-B (assert structure, not pixels).
- Analytics, feature flags, persistence, new libs/third-party deps.

## Resolved decisions (with rationale — override at the gate)
1. **Viewport detection = `useWindowDimensions()`** in a co-located `use-slide-layout` hook (Q1=A). *Why:* RN built-in (no dep), cross-platform, re-renders on resize/rotate; layout branches the **tree** not just styles, so unistyles `mq` can't do it. New pattern (first runtime viewport read) — accepted.
2. **Containment = nested right-pane `ScrollView` in `SlideView`; outer `ScrollView` stays** (Q2=B). *Why:* smaller blast radius than swapping the player wrapper; best-effort sticky accepted (risks R1/R2).
3. **Trigger = orientation-only:** `imagePortrait && window.width > height` (Q3=A). *Why:* matches the story Notes; one threshold, deterministic. Landscape phone may split (real horizontal room); AC #5 scoped to **portrait/narrow-portrait** viewports.
4. **`SlideImage` gains `layout: 'stacked' | 'split'`** (Q4=A). *Why:* `stacked` keeps today's width-driven `contentReading` cap; `split` = **height-bounded `contain`**, no 640 cap, so a portrait image fits its half instead of ballooning (the core goal). Stays presentational/per-variant testable.
5. **Bounded height = `LessonPlayer` measures its body `ScrollView` frame (`ref.measure()` in `useLayoutEffect`), passes `availableHeight` down** (revised Q5=B). *Why:* the only viewport-bounded box is the player's body scroller (outside `SlideView`); a descendant measures only content height (circular). `useLayoutEffect` is timing-only — the measured frame is the bound. Touches `LessonPlayer` (plumbing only).
6. **Pre-measure guard:** `availableHeight` undefined/≤0 → **stacked** (Q6). *Why:* always-visible, correctly-sized image on first paint; safe degrade if measurement never happens.
7. **Ratio = strict 50/50** (`flex:1` each), gap = `theme.layout.gutter` (16) (Q7=A). *Why:* matches "~50/50"; deterministic; decision 4's height-bound already prevents a huge image half.
8. **Uniform across all kinds; reading/focus order stays title → image → body; lightbox + no analytics/flags** (Q8). *Why:* split wraps whatever body `SlideView` routes; a11y order preserved (image column precedes body; body pane keyboard-scrollable).
9. **`use-slide-layout` = co-located presentational hook**, not a `libs/hooks` data hook. *Why:* pure view logic, no I/O (`hooks-service-dao.mdc` reserves `libs/hooks` for I/O; `component-split.mdc` co-locates component logic).

## Unresolved questions
_None — all decisions human-locked across the grilling (Q1–Q8, revised Q5)._
