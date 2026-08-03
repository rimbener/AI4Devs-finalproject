# Matching activity slide

**As a** learner
**I want** to pair related items by tapping one and then its match on a matching activity slide, and see which pairs I got right on submit
**so that** I know which relationships I understood without needing drag-and-drop

## Context
- Part of PRD R3 (Activity slide types with feedback) — in scope for v1 per Resolved Decisions (not P0 floor, but shipped in v1).
- Scoped to the matching activity type only — same boundaries as the other R3 stories (R4 navigation, R9 resume are separate stories).
- Interaction is explicitly **tap-to-select-two-items-to-pair, not drag-and-drop** (PRD Non-Goals #7 / Resolved Decisions) — the learner taps one item, then taps the item they believe matches it, forming a pair; this repeats until all items are paired, then Submit.
- Feedback is deferred to an explicit Submit (same submit-gated pattern as multiple-choice / fill-in-the-blank now). Submit is **hidden until every item is paired** — unpaired submit is not allowed.
- Slide data (from R2 generation) carries the left-side items, right-side items, and the correct pairing.
- Locked after submit — no retry. System-checked type: contributes to the R7 end-of-lesson score with per-pair partial credit.
- No analytics events for this story at this time (deferred).
- Component is a **template** in `@helsoft/activities` at `libs/activities/src/templates/matching/`. Shared submit/result: `ActivityResultPanel` + `ActivityResultContent`. Depends on `@helsoft/components` for shared atoms/molecules/theme.
- Folder follows `.agents/rules/component-split.mdc`:
  - `matching.tsx` — JSX, styles, a11y attrs, event handlers
  - `matching.types.ts` — Props + view models
  - `use-matching.ts` (+ reducer) — pending/pairs/grade/lock
  - `matching.helpers.ts` — pure helpers
  - co-located suites
- Pure grading in `@helsoft/activities` (`src/grading/grade-matching.ts`). Thin `MatchingActivity` passthrough in study-buddy. Chrome: `activity.result.*` + `activity.matching.{summary,correctPair,incorrectPair}`.

## Acceptance criteria
- Given a matching slide, when it renders, then both the left-side items and right-side items are visible, unpaired, and tappable; no drag interaction exists; Submit is hidden.
- Given the learner taps a left item then a right item (in either order), when both taps register, then that pair is formed and visually marked as paired (not yet graded).
- Given the learner taps an already-paired item before submitting, when the tap registers, then that item's existing pair is released so it can be re-paired.
- Given every item is paired, when Submit becomes visible and the learner taps it, then every formed pair is graded and each pair's correct/incorrect result is shown; the activity is then locked.
- Given at least one item is still unpaired, then Submit stays hidden (submission is blocked).
- Given the slide has an explanation, when results are shown, then the explanation is displayed alongside them.
- The correct/incorrect result (with per-pair counts) is exposed as answered state for R7 and R9.
- Given the template is implemented, when inspecting `libs/activities/src/templates/matching/`, then the folder is split per `.agents/rules/component-split.mdc`.

## Notes
- Extends the `Slide` activity payload with left/right item lists and the correct pairing in `libs/types/src/lesson.ts` — coordinate with R2.
- No retry after submit.
- Scoring granularity: per-pair partial credit (`correctPairCount` / `totalPairCount`) with derived whole-slide `isCorrect`.
- No analytics event for this story at this time.
- `matching.stories.tsx` must cover unpaired / partially-paired / submitted-all-correct / submitted-mixed-results states.
- Reiterates PRD Non-Goal #7 — no drag-and-drop; tap-to-select-two only.
