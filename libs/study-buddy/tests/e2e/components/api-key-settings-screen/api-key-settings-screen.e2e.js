const { test, expect } = require('@playwright/test');

// Title 'Features/ApiKeySettingsScreen' → slug 'features-apikeysettingsscreen'.
const story = (name) => `/?path=/story/features-apikeysettingsscreen--${name}`;

test('Empty story shows empty message and Add new provider', async ({ page }) => {
  await page.goto(story('empty'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator('text=API keys settings').first()).toBeVisible();
  await expect(canvas.locator('text=No API keys saved')).toBeVisible();
  await expect(canvas.getByRole('button', { name: 'Add new provider' })).toBeVisible();
});

test('Saved story renders masked status with Replace/Remove', async ({ page }) => {
  await page.goto(story('saved'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator('text=Groq key saved').first()).toBeVisible();
  await expect(canvas.locator('text=Replace').first()).toBeVisible();
  await expect(canvas.locator('text=Remove').first()).toBeVisible();
  await expect(canvas.getByRole('button', { name: 'Add new provider' })).toBeVisible();
});

test('NetworkError story renders the alert banner', async ({ page }) => {
  await page.goto(story('network-error'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  const alert = canvas.locator('[role="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("Couldn't reach the server. Try again.");
});
