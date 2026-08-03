# Fill-in-the-blank activity slide

**As a** learner
**I want** to type an answer into a fill-in-the-blank activity slide and see whether it's correct after submit
**so that** I know if I understood the material without waiting until the end of the lesson

## Context
- Part of PRD R3 (Activity slide types with feedback), P0 floor type.
- Scoped to the fill-in-the-blank activity type only — same boundaries as the multiple-choice story (R4 navigation, R9 resume/persistence are separate stories).
- Slide data (from R2 generation) carries the prompt/blank text and one or more accepted answers, optionally an explanation. Extends the `Slide` type the same way as the multiple-choice story.
- Grading: normalized comparison (trim + lowercase + collapse whitespace + strip diacritics) against the accepted answer(s). A match against any one of multiple accepted answers counts as correct.
- Locked after first submit — no retry. Incorrect reveals `acceptedAnswers[0]` only. Empty submit grades incorrect and still resolves.
- System-checked type: contributes to the R7 end-of-lesson score.
- No analytics events for this story at this time (deferred).
- Component is a **template** in `@helsoft/activities` at `libs/activities/src/templates/fill-in-the-blank/`. Shared submit/result: `ActivityResultPanel` + `ActivityResultContent`.
- Folder follows `.agents/rules/component-split.mdc` (tsx / types / use-* / helpers + suites).
- Pure grading in `@helsoft/activities` (`src/grading/grade-fill-in-the-blank.ts`). Thin `FillInTheBlankActivity` passthrough. Chrome: `activity.result.*` + `activity.fillInTheBlank.blankInput`.

## Acceptance criteria
- Given a fill-in-the-blank slide, when it renders, then an empty, editable inline blank is shown with the prompt and Submit is visible.
- Given the learner types an answer and submits, when the normalized input matches any accepted answer, then feedback marks it correct and locks.
- Given the learner's normalized input does not match any accepted answer, then feedback marks it incorrect and reveals `acceptedAnswers[0]`.
- Given the slide has an explanation, when feedback is shown, then the explanation is displayed with the result.
- After submitting, the input is locked (read-only) — no editing or resubmitting on this view.
- Given the learner submits an empty input, then it is graded as incorrect and feedback still resolves rather than the flow getting stuck.
- Submit button and Enter/return use the same grade path.
- The correct/incorrect result is exposed as answered state for R7 and R9.
- Given the template is implemented, when inspecting `libs/activities/src/templates/fill-in-the-blank/`, then the folder is split per `.agents/rules/component-split.mdc`.

## Notes
- Extends the `Slide` activity payload with `acceptedAnswers: string[]` in `libs/types/src/lesson.ts` — coordinate with R2.
- No retry once submitted.
- No analytics event for this story at this time.
- `fill-in-the-blank.stories.tsx` must cover unanswered / correct / incorrect states.
