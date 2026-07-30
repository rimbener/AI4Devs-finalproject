const { test, expect } = require('@playwright/test');

// Title 'Features/SignInForm' → slug 'features-signinform'.
const story = (name) => `/?path=/story/features-signinform--${name}`;

test('shows inline error for malformed email', async ({ page }) => {
  await page.goto(story('default'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByLabel('Email').fill('not-an-email');
  await canvas.getByLabel('Password').fill('secret1');
  await canvas.getByText('Log in', { exact: true }).click();

  await expect(canvas.getByText('Enter a valid email address', { exact: true })).toBeVisible();
});
