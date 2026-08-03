---
feature: activity-fill-in-the-blank
story: user-stories/activity-fill-in-the-blank.md
status: approved
---

# Spec — activity-fill-in-the-blank

> Post-ship note: template under `libs/activities/src/templates/fill-in-the-blank/`; shared
> submit/result via `ActivityResultPanel` + `ActivityResultContent`. Grader in
> `@helsoft/activities`. Chrome under `activity.result.*` (+ `activity.fillInTheBlank.blankInput`).

## Summary
Render and grade a **fill-in-the-blank** activity slide (PRD R3, P0). Learner sees a prompt with
an **inline blank** (`____` → TextInput), types an answer, submits via **Submit or Enter/return**.
Grading is **normalized** (trim + lowercase + collapse whitespace + strip diacritics) against any
of `acceptedAnswers`. On incorrect, reveal **`acceptedAnswers[0]` only**; optional explanation
with the result. Locks after first submit. Empty submit → incorrect and still resolves. Answered
state for R7/R9.

Scope: `FillInTheBlankSlide` / `FillInTheBlankAnswer` in `@helsoft/types`; pure grader in
`@helsoft/activities` (`src/grading/grade-fill-in-the-blank.ts`); template `FillInTheBlank`;
thin `FillInTheBlankActivity` wiring. No analytics/flags.

## User stories
- As a **learner**, I want **to type an answer into a fill-in-the-blank slide and see whether it's
  correct after submit**, so that **I know if I understood the material without waiting until the
  end of the lesson**.

## Data contract
```ts
// FillInTheBlankSlide: content with exactly one ____, acceptedAnswers[], explanation?
// FillInTheBlankAnswer: submittedAnswer, acceptedAnswerShown, isCorrect
```

```ts
// libs/activities/src/grading/grade-fill-in-the-blank.ts
isFillInTheBlankSlideValid(slide): boolean
normalizeFillInAnswer(raw: string): string
gradeFillInTheBlank(slide, submittedAnswer): FillInTheBlankAnswer
```

## Component contract
**`FillInTheBlank`** — template at `libs/activities/src/templates/fill-in-the-blank/`. Owns value
+ grading. Props: `slide`, `onAnswered?`, `initialAnswer?`. No `labels` / controlled value props.

- Split `content` on first `____`; inline TextInput.
- Unanswered: editable; Submit visible (`canSubmit={!locked}`); Enter/return = same submit path;
  empty grades incorrect.
- Answered: input read-only; `ActivityResultContent` with `isCorrect`, incorrect `summary` =
  `acceptedAnswerShown`, optional explanation.
- Unavailable: `activity.result.unavailable`.
- Blank a11y name: `activity.fillInTheBlank.blankInput`. Banner chrome: `activity.result.*`.

**`FillInTheBlankActivity`** — thin passthrough.

## Acceptance criteria
→ [`gherkin-scenarios.md`](./gherkin-scenarios.md).

## UI states
| State | Notes |
|---|---|
| Loading | N/A |
| Content | unanswered (Submit visible) / correct / incorrect (+ accepted reveal) |
| Error / Empty | unavailable |

## Out of scope
Retry; multiple blanks; fuzzy/AI grading; placeholder copy; R4/R9/R7 UI; R2 generation; analytics.

## Open decisions (resolved)
- Submit button + Enter; reveal `[0]` only; inline blank; normalize rules; empty submit OK;
  `maxLength = ceil(acceptedAnswers[0].length * 1.25)`; no placeholder.
- Template owns value + grade; grader in `@helsoft/activities`; shared result panel; i18n shared
  `activity.result.*` + `blankInput`.
