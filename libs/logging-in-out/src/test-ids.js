/**
 * testID strings for this lib's components, exported at `@helsoft/logging-in-out/test-ids`.
 * See `.agents/rules/app-e2e.mdc` for why this file is plain CommonJS and self-contained per lib.
 * TS-side types: `test-ids.d.ts`. Add a testID here (not a local constant) whenever it's needed by
 * an app-level e2e test — component-only testIDs (same-file Jest/RTL only) can stay local.
 */

const LOGIN_EMAIL_FIELD_TEST_ID = 'login-form-email-field';
const LOGIN_PASSWORD_FIELD_TEST_ID = 'login-form-password-field';
const LOGIN_SUBMIT_BUTTON_TEST_ID = 'login-form-submit-button';

module.exports = {
  LOGIN_EMAIL_FIELD_TEST_ID,
  LOGIN_PASSWORD_FIELD_TEST_ID,
  LOGIN_SUBMIT_BUTTON_TEST_ID,
};
