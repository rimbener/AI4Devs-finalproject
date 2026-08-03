---
feature: activity-open-ended
story: user-stories/activity-open-ended.md
status: approved
---

# Spec — activity-open-ended

> Post-ship note: template under `libs/activities/src/templates/open-ended/`; Submit/result via
> `ActivityResultPanel` + stacked `ActivityResultExplanation`. Shared chrome under
> `activity.result.*`; open-ended-specific: `yourAnswer` / `modelAnswer` / `answerInput`.

## Summary
Open-ended activity slide (PRD R3): multiline free-text → Submit → lock + reveal **model answer**
for self-comparison. Not auto-graded; no self-mark; R7-excluded. Answered = submitted-only for R9.

Scope: `OpenEndedSlide` / `OpenEndedAnswer` in `@helsoft/types`; `isOpenEndedSlideValid` (no
grader) in `@helsoft/study-buddy`; component-split template `OpenEnded`; thin `OpenEndedActivity`
wiring (validity + `maxLength` + emit). No analytics/flags. R4/R9/R7 UI out of scope.

## User stories
- As a **learner**, I want **to write a free-text answer and compare it to a model answer**, so
  that **I can self-assess when it can't be auto-graded**.

## Acceptance criteria
→ [`gherkin-scenarios.md`](./gherkin-scenarios.md) (`@s1`–`@s10`).

## Data contract
- `OpenEndedSlide`: `activityType: 'open-ended'`, `modelAnswer: string`, optional `explanation`;
  prompt = `SlideBase.content`.
- `OpenEndedAnswer`: `{ slideId, activityType: 'open-ended', submittedAnswer }` — **no**
  `isCorrect` / not `GradedAnswer`.
- `isOpenEndedSlideValid(slide)`: trimmed `content` + trimmed `modelAnswer` both non-empty.

## Component contract
- **`OpenEnded`** (`libs/activities/src/templates/open-ended/`): split `tsx` / `types` /
  `use-open-ended` / `helpers`. Props: `prompt`, `modelAnswer`, `explanation?`, `unavailable?`,
  `initialSubmittedAnswer?`, `maxLength`, `onSubmit`. **No `labels` prop** — calls
  `useLocalization()` itself.
- Unanswered: editable multiline (`TextField`), Submit visible (`canSubmit={!locked}`, empty OK);
  model hidden; Enter = newline only (`@s10`).
- Submitted: locked read-only; stacked `ActivityResultExplanation` for your/model (+ explanation);
  AT live-region announce; no grade/self-mark UI.
- Unavailable: `activity.result.unavailable`, non-interactive.
- **`OpenEndedActivity`**: `valid = isOpenEndedSlideValid`; `maxLength=2000`; emit
  `OpenEndedAnswer` once via `onAnswered`. Does **not** inject labels.

## UI states
| State | Notes |
|---|---|
| Loading | N/A (deck loaded before mount) |
| Content | unanswered / submitted |
| Error / Empty | unavailable (invalid prompt or modelAnswer) |

## Analytics / flags
None.

## Out of scope
Auto/AI grading; self-mark UI; R7 score UI; retry; Enter-to-submit; R4/R9/R2; analytics/flags.

## Open decisions (resolved)
- Story-locked: ungraded reveal; empty submit OK; no self-mark; R7 excluded; component-split;
  `use-open-ended` UI-only.
- Architecture: template + thin wiring + validity only (no DAO/service/grader).
- Multiline; Submit only; Enter = newline (`@s10`).
- Reveal = stacked labeled blocks via `ActivityResultExplanation`.
- `maxLength=2000`; valid = non-empty trimmed prompt + modelAnswer.
- i18n: `activity.result.{submit,explanation,unavailable}` +
  `activity.openEnded.{yourAnswer,modelAnswer,answerInput}`.
