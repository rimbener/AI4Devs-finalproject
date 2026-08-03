/**
 * ESM testIDs for @helsoft/activities/test-ids (Vite/Storybook).
 * Playwright Node require() uses test-ids.cjs — keep both in sync.
 */

export const LESSON_PLAYER_TEST_ID = 'lesson-player';
export const LESSON_PLAYER_NAV_BACK_TEST_ID = 'lesson-player-nav-back';
export const LESSON_PLAYER_NAV_NEXT_TEST_ID = 'lesson-player-nav-next';

export const FLASHCARD_REVEAL_TEST_ID = 'flashcard-reveal';
export const FLASHCARD_ANSWER_TEST_ID = 'flashcard-answer';
export const FLASHCARD_MARK_RECALLED_TEST_ID = 'flashcard-mark-recalled';
export const FLASHCARD_MARK_NOT_RECALLED_TEST_ID = 'flashcard-mark-not-recalled';

export const MULTIPLE_CHOICE_SUBMIT_TEST_ID = 'multiple-choice-submit';
export const MULTIPLE_CHOICE_OPTION_TEST_ID_PREFIX = 'multiple-choice-option-';
/** testID for one MultipleChoice AnswerOption, keyed by option id. */
export const multipleChoiceOptionTestId = (optionId) =>
  `${MULTIPLE_CHOICE_OPTION_TEST_ID_PREFIX}${optionId}`;

export const ACTIVITY_FOOTER_COLLAPSE_TEST_ID = 'activity-footer-collapse';
export const ACTIVITY_FOOTER_NEXT_TEST_ID = 'activity-footer-next';
