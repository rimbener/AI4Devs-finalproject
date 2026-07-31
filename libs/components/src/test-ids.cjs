/**
 * testID strings for this lib's components, exported at `@helsoft/components/test-ids`.
 * See `.agents/rules/app-e2e.mdc` for why this file is CJS for Playwright require(); ESM twin is test-ids.js for Vite.
 * TS-side types: `test-ids.d.ts`. Add a testID here (not a local constant) whenever it's needed by
 * an app-level e2e test — component-only testIDs (same-file Jest/RTL only) can stay local.
 */

const PDF_UPLOAD_PANEL_CHOOSE_FILE_TEST_ID = 'pdf-upload-panel-choose-file';
const PDF_UPLOAD_PANEL_CONTINUE_TEST_ID = 'pdf-upload-panel-continue';

/** testID for a PDF list row's status-driven action button (generate/retry/open), keyed by filename. */
const pdfDocumentListItemActionTestId = (filename) => `pdf-document-list-item-action-${filename}`;

const LESSON_GENERATION_GENERATE_TEST_ID = 'lesson-generation-generate';
const LESSON_GENERATION_OPEN_IN_PLAYER_TEST_ID = 'lesson-generation-open-in-player';

const RESULTS_RETAKE_TEST_ID = 'results-summary-retake';
const RESULTS_BACK_HOME_TEST_ID = 'results-summary-back-home';

const LESSON_LIST_TEST_ID = 'lesson-list';
const LESSON_LIST_ITEM_TITLE_TEST_ID_PREFIX = 'lesson-list-item-title-';
/** testID for one LessonList row's title, keyed by lesson id. */
const lessonListItemTitleTestId = (id) => `${LESSON_LIST_ITEM_TITLE_TEST_ID_PREFIX}${id}`;

module.exports = {
  PDF_UPLOAD_PANEL_CHOOSE_FILE_TEST_ID,
  PDF_UPLOAD_PANEL_CONTINUE_TEST_ID,
  pdfDocumentListItemActionTestId,
  LESSON_GENERATION_GENERATE_TEST_ID,
  LESSON_GENERATION_OPEN_IN_PLAYER_TEST_ID,
  RESULTS_RETAKE_TEST_ID,
  RESULTS_BACK_HOME_TEST_ID,
  LESSON_LIST_TEST_ID,
  lessonListItemTitleTestId,
};
