const { test, expect } = require('@playwright/test');

// Title 'Features/ApiKeySettingsButton' → slug 'features-apikeysettings'.
const story = (name) => `/?path=/story/features-apikeysettings--${name}`;

test('Entry story loads', async ({ page }) => {
  await page.goto(story('entry'));
  const iframe = page.locator('iframe[title="storybook-preview-iframe"]');
  await expect(iframe).toBeVisible();
  expect(page.url()).toContain('features-apikeysettings--entry');
});

test('Entry story renders Show API keys settings button', async ({ page }) => {
  await page.goto(story('entry'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByRole('button', { name: 'Show API keys settings' })).toBeVisible();
});

test('Loading story hides plan-sensitive settings', async ({ page }) => {
  await page.goto(story('loading'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByRole('button', { name: 'Show API keys settings' })).toHaveCount(0);
});

test('Paid story hides key settings with a saved key', async ({ page }) => {
  await page.goto(story('paid'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByRole('button', { name: 'Show API keys settings' })).toHaveCount(0);
  await expect(canvas.locator('text=Groq key saved')).toHaveCount(0);
});

test('ProfileError story renders retry and hides key settings', async ({ page }) => {
  await page.goto(story('profile-error'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByRole('alert')).toContainText("We couldn't load your plan.");
  await expect(canvas.getByText('Try again', { exact: true })).toBeVisible();
  await expect(canvas.getByRole('button', { name: 'Show API keys settings' })).toHaveCount(0);
});
