---
feature: activity-multiple-choice
story: user-stories/activity-multiple-choice.md
status: spec_ready
---

# Spec — activity-multiple-choice

> Post-ship note: activity templates live under `libs/activities/src/templates/`; shared
> submit/result chrome is `ActivityResultPanel` + `ActivityResultContent` via
> `ActivityScrollViewProvider`. Grade-on-select is gone — select → Submit → grade/lock.

## Summary
Render and grade a **multiple-choice** activity slide (PRD R3, a P0 floor type). A learner sees a
question with N options, **selects one**, then taps **Submit** in the shared activity footer to
get correct/incorrect feedback. A wrong pick reveals the correct option, and an optional
explanation shows with the result (collapsible). The attempt **locks on Submit** (non-interactive,
no re-selection, no retry — learning gain is measured via whole-lesson retakes, R7). The graded
result is surfaced as a typed **answered-state** object for R7 (score) and R9 (resume).

Scope is only this type: `MultipleChoiceSlide` in `libs/types/src/lesson.ts`; pure grader in
`@helsoft/activities` (`src/grading/grade-multiple-choice.ts`); template
`MultipleChoice` in `libs/activities/src/templates/multiple-choice/`; thin
`MultipleChoiceActivity` wiring in `@helsoft/study-buddy`. Navigation (R4) and persistence/resume
(R9) are separate stories. No analytics, no feature flags. Reuses `AnswerOption` from
`@helsoft/components`.

## User stories
- As a **learner**, I want to select an answer, submit it, and see whether I got it right, so I
  know if I understood the material without waiting until the end of the lesson.

## Contracts (source of truth lives in code)
- **`Slide` union** (`libs/types/src/lesson.ts`) keyed on `kind` / `activityType`.
  `MultipleChoiceSlide` = `SlideBase` + `{ kind:'activity', activityType:'multiple-choice',
  options:{id,label}[], correctOptionId, explanation? }`; `content` holds the question.
- **`MultipleChoiceAnswer`** (`activity-answer.ts`) = `{ slideId, activityType, selectedOptionId,
  correctOptionId, isCorrect }` — emitted **once** via `onAnswered` on Submit.
- **`gradeMultipleChoice(slide, selectedOptionId)`** (`libs/activities/src/grading/`) — pure;
  `isCorrect = selected === correctOptionId`; throws if `selectedOptionId` ∉ `slide.options`.
- **`MultipleChoice` template** — owns selection + grading; calls `useLocalization()` for chrome
  (`activity.result.*`). No `labels` prop.
  - Unanswered, no selection → options enabled; Submit **hidden** (`canSubmit=false`).
  - Selection pending → selected option pending; options still interactive; Submit **visible**.
  - After Submit (locked) → all options disabled; correct tile `correct`, selected-if-wrong
    `incorrect`; result via `ActivityResultPanel` + `ActivityResultContent` (banner + optional
    collapsible explanation). Markers `A/B/C…` by index.
- **`MultipleChoiceActivity`** — thin passthrough of `slide` / `onAnswered` / `initialAnswer`.
- **Footer / Next** — under `ActivityScrollViewProvider`, Submit/result pin below the ScrollView;
  shared footer Next shows only once `hasResult`. Standalone (Storybook) renders the panel inline.

## Acceptance criteria → see `gherkin-scenarios.md` (each `@s` scenario is an AC)

## UI states (`MultipleChoice` template)
| State | Trigger | Notes |
|---|---|---|
| Loading | **N/A** — deck loaded upstream by the R4 player. | No Loading UI. |
| Content | ≥1 option and `correctOptionId` ∈ options. (a) unanswered no selection; (b) selection pending (Submit visible); (c) answered-correct; (d) answered-incorrect (correct tile revealed). | |
| Error | `correctOptionId` ∉ options (or unrenderable payload). | `activity.result.unavailable`, non-interactive. |
| Empty | Zero options. | Same unavailable notice. |

## Analytics / Feature flags
None.

## Out of scope / non-goals
Slide navigation/lesson player (R4); persistence/resume (R9); end-of-lesson scoring UI (R7);
retry/re-answer; multi-select; other activity types; AI generation of the slide (R2); analytics &
feature flags. Grade-on-select (removed — Submit is required).

## Open decisions (resolved)
- **Grading is a pure function in `@helsoft/activities`** — no I/O; template owns grade + lock.
- **Select then Submit** — selection alone does not grade or lock; Submit emits answered state.
- **Shared result chrome** — `ActivityResultPanel` + `ActivityResultContent`; i18n under
  `activity.result.*` (+ `activity.footer.*` for collapse/expand).
- **Thin study-buddy wrapper** — no labels injection, no local grade state.
- **Loading N/A**; Empty + Error → unavailable; `content` = question, `title` = short heading;
  `correctOptionId` single string; chrome only localized.

## Human-accepted risks (post-implementation, full review Round 3 of 3)
- **Risk (m4-b):** On Android, post-answer announcement historically relied on live region vs
  imperative announce. Detail in archived `review.md` → m4-b. Follow-up: on-device TalkBack pass
  recommended, not blocking. Result chrome now lives in shared `ActivityResultContent`.
