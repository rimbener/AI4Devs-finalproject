# Activity Types — Exploration Notes

Candidate activity types for the study-buddy lesson player (`libs/activities`),
beyond the existing five (`multiple-choice`, `matching`, `fill-in-the-blank`,
`flashcard`, `open-ended`).

All are system-checkable candidates, so if landed they'd also be added to
`SYSTEM_CHECKED_ACTIVITY_TYPES` in `libs/types/src/activity-type.ts`.

## Existing activities

The five activity types already shipped in `libs/types/src/lesson.ts`, each with
its organism (`libs/activities/src/organisms/`), Storybook story, and unit tests.

### Multiple Choice

Pick the single correct option out of N. The prompt is the slide `content`; options
carry stable ids and the correct one is stored as `correctOptionId`, so answers
survive a resumed session. System-checked. The only type the generator can produce
today.

### Fill-in-the-Blank

Type the missing word into a blank marked `____` inside the prompt. The normalized
input is matched against `acceptedAnswers` (any match counts). System-checked.

### Flashcard

Front shows the prompt (`content`), the learner flips to reveal the answer (`back`).
Self-marked — it never counts toward the end-of-lesson score, and no answer is
persisted.

### Open-Ended

Free-text response to a prompt. After submitting, a `modelAnswer` is revealed for
self-comparison. Ungraded — deliberately excluded from the score.

### Matching

Pair each left-column item with its right-column counterpart. The correct pairing
is an exact perfect matching (`leftItems.length === rightItems.length ===
correctPairs.length`, cross-column only). System-checked.

## True / False

A statement presented with just two options: True / False. The learner reads the
prompt (the slide `content`) and picks one.

- **Cost to build:** near-zero — a binary choice reuses the existing
  multiple-choice data model and grading (two options, one correct).
- **Tradeoff:** high "guessability" (50% by chance), so a single item is weak
  evidence of learning. Works best as a quick comprehension check across several
  statements.
- **Data model:** essentially `MultipleChoiceSlide` with exactly two options.

## Ordering / Sequence

Items (steps, events, timeline entries) that the learner must arrange into the
correct order.

- **Cost to build:** medium — new interaction (tap-to-select order or drag), new
  data model (`orderedItems` + a canonical order), and a grading function that
  compares the submitted order against the correct one.
- **Tradeoff:** great for processes, timelines, and causal chains that MC can't
  express. Grading is exact-match on order; partial credit requires a
  longest-correct-run or inversion-count heuristic.
- **Data model:** `OrderingSlide` with `items: { id, label }[]` plus a canonical
  ordering (or the items array itself in correct order).

## Categorization

Items that must be sorted into 2+ buckets (e.g. "Verdadero/Falso", "Animal/Vegetal",
"Forward/Reverse").

- **Cost to build:** medium-high — needs the bucket list plus per-item assignments;
  interaction can be tap-a-bucket or drag-and-drop.
- **Tradeoff:** flexible and natural for taxonomies and concept discrimination,
  but busy on small screens with many items or buckets. Grading is exact-match per
  item (optionally partial credit per correct bucket).
- **Data model:** `CategorizationSlide` with `buckets: { id, label }[]` and
  `items: { id, label, bucketId }[]`.

## Word Bank

Fill-in-the-blank where the accepted answers are offered as a pool to choose from
(tap a word → fills the blank) instead of typed freely.

- **Cost to build:** low-medium — the data model is `FillInTheBlankSlide` +
  a fixed `wordBank` array; grading stays normalized match against
  `acceptedAnswers`.
- **Tradeoff:** eliminates spelling/typing friction and is mobile-friendly, at the
  cost of a mild hint (the pool narrows the answer space). Good bridge between
  recognition and recall.
- **Data model:** extend `FillInTheBlankSlide` with an optional `wordBank: string[]`
  (absent → free typing, current behavior).

## True / False with Justification

True/False plus a short free-text justification for the choice.

- **Cost to build:** low — it's a variant of True/False; the justification reuses
  the open-ended answer field and is *not* system-graded (learner compares with a
  model justification).
- **Tradeoff:** forces deeper reasoning than plain T/F, but grading is hybrid:
  the binary part counts toward the score, the justification is self-assessed like
  `open-ended`. Design decision: should the slide count toward the score at all?
- **Data model:** `TrueFalseSlide` + `modelJustification?: string`; grading
  reuses MC logic for the choice only.
