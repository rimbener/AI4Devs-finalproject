---
feature: activity-flashcard-recall
story: user-stories/activity-flashcard-recall.md
status: approved
---

# Spec — activity-flashcard-recall

> Post-ship note: template under `libs/activities/src/templates/flashcard/`. No
> `ActivityResultPanel` (self-mark only). Answer/explanation via `ActivityResultExplanation`.
> Shared keys: `activity.result.{answerHeading,explanation,unavailable}`; flashcard actions under
> `activity.flashcard.*`. Under `ActivityScrollViewProvider`, footer Next hidden until self-mark.

## Summary
Render a **flashcard / recall** activity slide (PRD R3, P0). Learner sees the **front/prompt**
only; taps to **reveal** the **back/answer** (plus optional explanation); then **self-marks**
"Recalled" or "Not recalled". Self-marked, not graded — no grader module. Locked once chosen;
answered state for R9; **excluded from R7**.

## User stories
- As a **learner**, I want **to reveal a flashcard's answer and mark for myself whether I recalled
  it**, so that **I can gauge my own understanding as I study, even though it isn't part of my
  graded score**.

## Building blocks (reuse)
- `Card` / `Icon` / `Button` + theme tokens from `@helsoft/components`.
- `@helsoft/localization` inside the template.
- `ActivityResultExplanation` for revealed answer + explanation.
- `useActivityFooter().setNextVisible` gates player footer Next until self-mark.

## Data contract
```ts
// FlashcardSlide: content = front, back, explanation?
// FlashcardAnswer: recalled, isCorrect (= recalled); R7-excluded
```

```ts
// libs/activities/src/templates/flashcard/flashcard.helpers.ts
isFlashcardSlideValid(slide: FlashcardSlide): boolean
buildFlashcardAnswer(slide, recalled: boolean): FlashcardAnswer
```

## Component contract
**`Flashcard`** — template at `libs/activities/src/templates/flashcard/`. Owns reveal + self-mark
+ lock; emits `onAnswered` once on self-mark.

```ts
export type FlashcardProps = {
  slide: FlashcardSlide;
  onAnswered?: (answer: FlashcardAnswer) => void;
  initialAnswer?: FlashcardAnswer | null;
  initialRevealed?: boolean;
};
```

No `labels` / `FlashcardLabels` prop — chrome via `t()`.

**`FlashcardActivity`** — thin passthrough (`slide` / `onAnswered` / `initialAnswer`).

## Acceptance criteria
→ **`gherkin-scenarios.md`** (`@s1`–`@s10`).

## UI states
| State | Notes |
|---|---|
| Loading | N/A |
| Content | hidden / revealed-unmarked / marked-recalled / marked-not-recalled |
| Error / Empty | unavailable (`activity.result.unavailable`) |

## Out of scope
System grading; R7 scorer changes; R4/R9 UI; R2 generation; un-reveal/re-mark; other types;
analytics/flags.

## Open decisions (resolved)
- R7 already excludes flashcard; `content` = front, `back` = answer; `isCorrect` mirrors
  `recalled`.
- No grader / data hook; template + thin wiring; reveal one-way; self-mark one-time lock.
- Empty + Error → one unavailable path.
- i18n: `activity.flashcard.{reveal,recalled,notRecalled,*Confirmed}` +
  `activity.result.{answerHeading,explanation,unavailable}`.
- Player footer Next gated until self-mark when under `ActivityScrollViewProvider`.
