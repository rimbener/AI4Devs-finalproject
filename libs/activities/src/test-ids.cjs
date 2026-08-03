/**
 * testID strings for this lib's components, exported at `@helsoft/activities/test-ids`.
 * See `.agents/rules/app-e2e.mdc` for why this file is CJS for Playwright require(); ESM twin is test-ids.js for Vite.
 * TS-side types: `test-ids.d.ts`. Add a testID here (not a local constant) whenever it's needed by
 * an app-level e2e test — component-only testIDs (same-file Jest/RTL only) can stay local.
 */

const LESSON_PLAYER_TEST_ID = 'lesson-player';
const LESSON_PLAYER_NAV_BACK_TEST_ID = 'lesson-player-nav-back';
const LESSON_PLAYER_NAV_NEXT_TEST_ID = 'lesson-player-nav-next';

const FLASHCARD_REVEAL_TEST_ID = 'flashcard-reveal';
const FLASHCARD_ANSWER_TEST_ID = 'flashcard-answer';
const FLASHCARD_MARK_RECALLED_TEST_ID = 'flashcard-mark-recalled';
const FLASHCARD_MARK_NOT_RECALLED_TEST_ID = 'flashcard-mark-not-recalled';

const MULTIPLE_CHOICE_SUBMIT_TEST_ID = 'multiple-choice-submit';
const MULTIPLE_CHOICE_OPTION_TEST_ID_PREFIX = 'multiple-choice-option-';
/** testID for one MultipleChoice AnswerOption, keyed by option id. */
const multipleChoiceOptionTestId = (optionId) =>
  `${MULTIPLE_CHOICE_OPTION_TEST_ID_PREFIX}${optionId}`;

const ACTIVITY_FOOTER_COLLAPSE_TEST_ID = 'activity-footer-collapse';
const ACTIVITY_FOOTER_NEXT_TEST_ID = 'activity-footer-next';

module.exports = {
  LESSON_PLAYER_TEST_ID,
  LESSON_PLAYER_NAV_BACK_TEST_ID,
  LESSON_PLAYER_NAV_NEXT_TEST_ID,
  FLASHCARD_REVEAL_TEST_ID,
  FLASHCARD_ANSWER_TEST_ID,
  FLASHCARD_MARK_RECALLED_TEST_ID,
  FLASHCARD_MARK_NOT_RECALLED_TEST_ID,
  MULTIPLE_CHOICE_SUBMIT_TEST_ID,
  MULTIPLE_CHOICE_OPTION_TEST_ID_PREFIX,
  multipleChoiceOptionTestId,
  ACTIVITY_FOOTER_COLLAPSE_TEST_ID,
  ACTIVITY_FOOTER_NEXT_TEST_ID,
};
