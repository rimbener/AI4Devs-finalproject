# Open-ended / short answer activity slide

**As a** learner
**I want** to write a free-text answer on an open-ended activity slide and compare it against a model answer
**so that** I can self-assess my understanding even when the answer can't be auto-graded

## Context
- Part of PRD R3 (Activity slide types with feedback) — in scope for v1 per Resolved Decisions (not P0 floor, but shipped in v1).
- Scoped to the open-ended/short-answer activity type only — same boundaries as the other R3 stories (R4 navigation, R9 resume are separate stories).
- Slide data (from R2 generation) carries a prompt and a model answer, optionally an explanation.
- Not auto-graded in v1 (PRD, explicit) and excluded from the R7 end-of-lesson score entirely. Product decision: no self-mark either (unlike flashcard) — it's shown purely for the learner's own comparison.
- No analytics events for this story at this time (deferred).
- Component is a **template** in `@helsoft/activities` at `libs/activities/src/templates/open-ended/`. Submit/result via `ActivityResultPanel` + stacked `ActivityResultExplanation`.
- Folder follows `.agents/rules/component-split.mdc` (tsx / types / use-* / helpers + suites).
- No system grading module in v1. Validity helper in `@helsoft/study-buddy` (`src/grading/is-open-ended-slide-valid.ts`). Thin `OpenEndedActivity` owns validity + `maxLength=2000` + answered-state emit (no labels injection). Chrome: `activity.result.*` + `activity.openEnded.{yourAnswer,modelAnswer,answerInput}`.

## Acceptance criteria
- Given an open-ended slide, when it renders, then an empty, editable free-text input is shown with the prompt; the model answer is hidden; Submit is visible (empty submit allowed).
- Given the learner types a response and submits, when the submission registers, then the input is locked (read-only, no further edits) and the model answer is revealed next to the learner's own submitted text.
- Given the slide has an explanation, when the model answer is revealed, then the explanation is displayed alongside it.
- Given the learner submits an empty response, then the model answer is still revealed (submission doesn't require non-empty text) rather than the flow getting stuck.
- Enter/return inserts a newline and does not submit.
- This slide never contributes a correct/incorrect result — it's excluded entirely from the R7 score total and carries no self-mark, only "answered" (submitted) state for R9 resume continuity.
- Given the template is implemented, when inspecting `libs/activities/src/templates/open-ended/`, then the folder is split per `.agents/rules/component-split.mdc`.

## Notes
- Extends the `Slide` activity payload with `modelAnswer` in `libs/types/src/lesson.ts` — coordinate with R2.
- Excluded from the R7 score aggregate; no self-mark UI (product decision — differs from flashcard).
- No analytics event for this story at this time.
- `open-ended.stories.tsx` must cover unanswered / submitted-with-model-answer states.
- Future consideration (P1, out of scope here): AI auto-grading of open-ended answers (PRD Nice-to-Have).
