---
feature: activity-matching
story: user-stories/activity-matching.md
status: spec_ready
---

# Spec — activity-matching

> Post-ship note: template under `libs/activities/src/templates/matching/`; shared
> submit/result via `ActivityResultPanel` + `ActivityResultContent`. Submit is
> **hidden** until all paired (not merely disabled). MCQ is also submit-gated now.

## Summary
Render and grade a **matching** activity slide (PRD R3). Learner pairs left↔right items by
**tap-then-tap** (no drag-and-drop). Feedback is deferred to **Submit**, enabled only once every
item is paired. On Submit each pair is graded, locked, and shown via the shared result panel with
per-pair partial credit (`correctPairCount` / `totalPairCount`) for R7/R9.

Scope: `MatchingSlide` / `MatchingAnswer` in `@helsoft/types`; pure grader in
`@helsoft/activities` (`src/grading/grade-matching.ts`); template `Matching` in
`libs/activities/src/templates/matching/`; thin `MatchingActivity` wiring. No analytics/flags.

## User stories
- As a **learner**, I want **to pair related items by tapping one then its match, and see which
  pairs I got right on Submit**, so that **I know which relationships I understood without
  needing drag-and-drop**.

## Building blocks (reuse)
- `Card` / `Icon` / theme tokens from `@helsoft/components`.
- `@helsoft/localization` — template calls `useLocalization()`; shared chrome under
  `activity.result.*` / `activity.footer.*`; matching-specific: `activity.matching.summary`,
  `correctPair`, `incorrectPair`.
- Shared footer: `ActivityResultPanel` + `ActivityResultContent` (+ `ActivityScrollViewProvider`
  in the player). Footer Next shows after result.

## Data contract
(Unchanged shapes — see `libs/types`.)

```ts
// MatchingSlide: leftItems, rightItems, correctPairs, explanation?
// MatchingAnswer: pairs: GradedPair[], correctPairCount, totalPairCount, isCorrect
```

```ts
// libs/activities/src/grading/grade-matching.ts
isMatchingSlideValid(slide: MatchingSlide): boolean
gradeMatching(slide: MatchingSlide, pairs: MatchingPair[]): MatchingAnswer
```

## Component contract
**`Matching`** — template at `libs/activities/src/templates/matching/`. Owns pending/pairs/
grading/lock. Props: `slide`, `onAnswered?`, `initialAnswer?`, `initialPairs?`. No `labels` /
`result` / `onSubmit` props.

**Selection UX (unsubmitted)** — unchanged:
- 1st tap unpaired → pending; opposite-column unpaired → form pair; same pending → deselect;
  same-column retarget; tap paired → release pair.

**Submit gate** — Submit **hidden** until `allPaired` (`canSubmit={allPaired}`). No unpaired
submit path. On Submit → `gradeMatching` → lock → `onAnswered` once.

**Result** — `ActivityResultContent` with `isCorrect`, `summary` (`activity.matching.summary`
interpolated), optional explanation. Per-item correct/incorrect via text + icon. Banner chrome:
`activity.result.correct|incorrect`.

**Unavailable** — invalid slide → `activity.result.unavailable`, non-interactive.

**`MatchingActivity`** — thin passthrough of `slide` / `onAnswered` / `initialAnswer`.

## Acceptance criteria
→ [`gherkin-scenarios.md`](./gherkin-scenarios.md) (`@s1`–`@s17`).

## UI states
| State | Notes |
|---|---|
| Loading | N/A |
| Content | unpaired / partially-paired (Submit hidden) / all-paired (Submit visible) / submitted-all-correct / submitted-mixed |
| Error / Empty | unavailable |

## Out of scope
Drag-and-drop; unpaired submit; R4/R9/R7 UI; retry; same-column / many-to-one; other types; R2
generation; analytics/flags.

## Open decisions (resolved)
- Per-pair partial credit; left↔right only; equal column lengths; Submit only when all paired.
- Architecture: template owns interaction + grading; thin study-buddy wiring; grader in
  `@helsoft/activities`.
- Shared result panel; i18n: shared `activity.result.*` + matching summary/pair a11y keys.
- Loading N/A; `content` = prompt.

## Unresolved questions
_None._
