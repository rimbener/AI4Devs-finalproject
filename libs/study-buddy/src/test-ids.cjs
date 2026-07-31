/**
 * testID strings for this lib's components, exported at `@helsoft/study-buddy/test-ids`.
 * See `.agents/rules/app-e2e.mdc` for why this file is CJS for Playwright require(); ESM twin is test-ids.js for Vite.
 * TS-side types: `test-ids.d.ts`. Add a testID here (not a local constant) whenever it's needed by
 * an app-level e2e test — component-only testIDs (same-file Jest/RTL only) can stay local.
 */

const NEW_LESSON_DIALOG_CHOOSE_FILE_TEST_ID = 'new-lesson-dialog-choose-file';

module.exports = {
  NEW_LESSON_DIALOG_CHOOSE_FILE_TEST_ID,
};
