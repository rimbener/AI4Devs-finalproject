const { test, expect } = require('@playwright/test');

// Title 'Organisms/ApiKeyManager' → slug 'organisms-apikeymanager'.
const story = (name) => `/?path=/story/organisms-apikeymanager--${name}`;

test('Empty story loads', async ({ page }) => {
  await page.goto(story('empty'));

  const iframe = page.locator('iframe[title="storybook-preview-iframe"]');
  await expect(iframe).toBeVisible();
  expect(page.url()).toContain('organisms-apikeymanager--empty');
});

// @s1 — Empty: message + Add new provider button only (no inline radios).
test('Empty story shows empty message and Add new provider button only', async ({ page }) => {
  await page.goto(story('empty'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator('text=No API keys saved')).toBeVisible();
  await expect(canvas.getByRole('button', { name: 'Add new provider' })).toBeVisible();
});

// @s3 — Content: masked saved row + Add still available.
test('Content story renders the masked saved row with Replace and Remove controls', async ({
  page,
}) => {
  await page.goto(story('content'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator('text=Groq key saved').first()).toBeVisible();
  await expect(canvas.getByRole('button', { name: 'Add new provider' })).toBeVisible();

  const replaceControl = canvas
    .locator('text=Replace')
    .first()
    .locator('xpath=ancestor::button[1]');
  await expect(replaceControl).toBeEnabled();

  const removeControl = canvas.locator('text=Remove').first().locator('xpath=ancestor::button[1]');
  await expect(removeControl).toBeEnabled();
});

// All-saved — Add button hidden.
test('AllSaved story hides Add new provider when all providers have keys', async ({ page }) => {
  await page.goto(story('all-saved'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByRole('button', { name: 'Add new provider' })).toHaveCount(0);
  await expect(canvas.locator('text=key saved').first()).toBeVisible();
});

test('Loading story renders a progress indicator and no Add button', async ({ page }) => {
  await page.goto(story('loading'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator('[role="progressbar"]')).toBeVisible();
  await expect(canvas.getByRole('button', { name: 'Add new provider' })).toHaveCount(0);
});

test('Error story renders an error banner with the message text', async ({ page }) => {
  await page.goto(story('error'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator("text=Couldn't reach the server. Try again.")).toBeVisible();
});
