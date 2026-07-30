const { test, expect } = require('@playwright/test');
const { LOGIN_EMAIL_FIELD_TEST_ID } = require('@helsoft/logging-in-out/test-ids');
const { login } = require('./helpers/golden-path');

// @s1 (golden path) — filling valid credentials and submitting swaps the app into the
// authenticated stack (Stack.Protected reacts to the session, the login form unmounts).
test('submitting valid credentials signs in and leaves the login screen', async ({ page }) => {
  await login(page);

  await expect(page.getByTestId(LOGIN_EMAIL_FIELD_TEST_ID)).toBeHidden();
});
