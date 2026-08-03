# Multiple choice activity slide

**As a** learner
**I want** to select an answer on a multiple-choice activity slide, submit it, and see whether I got it right
**so that** I know if I understood the material without waiting until the end of the lesson

## Context
- Part of PRD R3 (Activity slide types with feedback), P0 floor type.
- Scoped to the multiple-choice activity type only: rendering the question + options, grading, and showing feedback. Slide-to-slide navigation is R4 (separate story); saving/resuming progress is R9 (separate story) — this story just needs to expose answered/correct state in a shape those stories can persist later.
- Slide data comes from AI generation (R2): each multiple-choice slide carries the question text, the list of options, and the correct option, optionally an explanation. The current `Slide` type (`libs/types/src/lesson.ts`) has no per-type payload yet — extending it (e.g. a discriminated union keyed by activity type) to carry `options`/`correctOptionId` is in scope here.
- Flow: select an option (pending) → Submit in the shared `ActivityResultPanel` → grade + lock. Options stay interactive until Submit; after Submit they become non-interactive, the selected option and the correct option are both visually distinguished, and no re-selection is allowed on that view (product decision: no retry).
- Multiple choice is a system-checked type: its correct/incorrect result feeds into the end-of-lesson score (R7).
- No analytics events for this story at this time (deferred).
- Component lives in `@helsoft/activities` as a **template** under `libs/activities/src/templates/multiple-choice/` (atomic design). Depends on `@helsoft/components` for shared atoms/molecules/theme. Shared submit/result chrome: `ActivityResultPanel` + `ActivityResultContent` (+ `ActivityScrollViewProvider` in the player).
- Folder follows `.agents/rules/component-split.mdc` (non-trivial UI with state + pure logic):
  - `multiple-choice.tsx` — JSX, styles, a11y attrs, **event handlers** (option `onPress`, Submit)
  - `multiple-choice.types.ts` — `Props` + related view types (no JSX → `.ts`)
  - `use-multiple-choice.ts` — graded-answer state, derived flags (`locked`, `canSubmit`, `isUnavailable`, `stateForOption`, …)
  - `multiple-choice.helpers.ts` — pure helpers (`optionAccessibilityLabel`, `optionMarkerAt`, …)
  - co-located suites: one per file above (`.test.ts` / `.test.tsx`)
- Pure grading lives in `@helsoft/activities` (`src/grading/grade-multiple-choice.ts`) — no DAO/service call. Chrome via `activity.result.*` (no per-type `activity.mcq.*` banner keys). Thin `MultipleChoiceActivity` in study-buddy is a passthrough.

## Acceptance criteria
- Given a multiple-choice slide with N options, when it renders, then all options are visible and selectable, none pre-selected, and Submit is hidden.
- Given the learner taps an option, when the tap registers, then that option becomes the pending selection, Submit becomes visible, and options stay interactive (not yet graded).
- Given the learner taps Submit with the correct option selected, then feedback marks it as correct and locks the attempt.
- Given the learner taps Submit with a wrong option selected, then feedback marks the selected option as incorrect and visually reveals the correct option alongside it.
- Given the slide has an explanation, when the result is shown, then the explanation is displayed with the result (collapsible in the shared panel).
- Only one option can be selected per attempt — no multi-select in v1 (matches PRD wording "learner selects an option").
- The correct/incorrect result is exposed as part of this slide's answered state so it can be included in the end-of-lesson score (R7) and later persisted for resume (R9).
- Given the template is implemented, when inspecting `libs/activities/src/templates/multiple-choice/`, then the folder is split per `.agents/rules/component-split.mdc` (`.tsx` / `.types.ts` / `use-*.ts` / `.helpers.ts` + co-located suites); handlers live in the component, state/derived/effects in the hook, pure transforms in helpers.

## Notes
- Extends `Slide` with a multiple-choice payload in `libs/types/src/lesson.ts` — coordinate with the R2 generation story so the shape matches what the Edge Function returns.
- No retry: once submitted, the attempt is final for that lesson view (learning gain is measured via whole-lesson retakes, R7, not per-question retries).
- No analytics event for this story at this time.
- `multiple-choice.stories.tsx` must cover unanswered / selection-pending / correct-submitted / incorrect-submitted states.
- Follows `.agents/rules/atomic-design.mdc` for component placement, `.agents/rules/component-split.mdc` for the folder shape, and `.agents/rules/hooks-service-dao.mdc` for where grading vs data-layer logic lives.
