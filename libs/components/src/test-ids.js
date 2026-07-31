/**
 * ESM testIDs for @helsoft/components/test-ids (Vite/Storybook).
 * Playwright Node require() uses test-ids.cjs — keep both in sync.
 */

export const PDF_UPLOAD_PANEL_CHOOSE_FILE_TEST_ID = 'pdf-upload-panel-choose-file';
export const PDF_UPLOAD_PANEL_CONTINUE_TEST_ID = 'pdf-upload-panel-continue';

/** testID for a PDF list row's status-driven action button (generate/retry/open), keyed by filename. */
export const pdfDocumentListItemActionTestId = (filename) =>
  `pdf-document-list-item-action-${filename}`;

export const LESSON_GENERATION_GENERATE_TEST_ID = 'lesson-generation-generate';
export const LESSON_GENERATION_OPEN_IN_PLAYER_TEST_ID = 'lesson-generation-open-in-player';

export const RESULTS_RETAKE_TEST_ID = 'results-summary-retake';
export const RESULTS_BACK_HOME_TEST_ID = 'results-summary-back-home';

export const LESSON_LIST_TEST_ID = 'lesson-list';
const LESSON_LIST_ITEM_TITLE_TEST_ID_PREFIX = 'lesson-list-item-title-';
/** testID for one LessonList row's title, keyed by lesson id. */
export const lessonListItemTitleTestId = (id) => `${LESSON_LIST_ITEM_TITLE_TEST_ID_PREFIX}${id}`;
