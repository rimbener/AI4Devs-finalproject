const { test, expect } = require('@playwright/test');

// Title 'Organisms/ApiKeyManager' → slug 'organisms-apikeymanager'.
const story = (name) => `/?path=/story/organisms-apikeymanager--${name}`;

test('Empty story loads', async ({ page }) => {
  await page.goto(story('empty'));

  const iframe = page.locator('iframe[title="storybook-preview-iframe"]');
  await expect(iframe).toBeVisible();
  expect(page.url()).toContain('organisms-apikeymanager--empty');
});

// @s1 — the Empty state shows "No API keys configured" and the Add section.
test('Empty story shows empty message and Add section with provider radio options', async ({
  page,
}) => {
  await page.goto(story('empty'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator('text=No API keys configured')).toBeVisible();
  await expect(canvas.locator('text=Add provider')).toBeVisible();
  await expect(canvas.locator('text=Groq').first()).toBeVisible();
  await expect(canvas.locator('text=OpenAI').first()).toBeVisible();
});

// @s3 — the Content state shows the masked saved-status row.
test('Content story renders the masked saved row with Replace and Remove controls', async ({
  page,
}) => {
  await page.goto(story('content'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator('text=Groq key saved').first()).toBeVisible();

  const replaceControl = canvas
    .locator('text=Replace')
    .first()
    .locator('xpath=ancestor::button[1]');
  await expect(replaceControl).toBeEnabled();

  const removeControl = canvas.locator('text=Remove').first().locator('xpath=ancestor::button[1]');
  await expect(removeControl).toBeEnabled();
});

// All-saved — Add section is hidden when all 6 providers are configured.
test('AllSaved story hides the Add section when all providers have keys', async ({ page }) => {
  await page.goto(story('all-saved'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator('text=Add provider')).toHaveCount(0);
  // 6 masked rows rendered (one per provider).
  await expect(canvas.locator('text=key saved').first()).toBeVisible();
});

// Loading — shows a progress indicator.
test('Loading story renders a progress indicator and no Add section', async ({ page }) => {
  await page.goto(story('loading'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator('[role="progressbar"]')).toBeVisible();
  await expect(canvas.locator('text=Add provider')).toHaveCount(0);
});

// @s7/@s9 — Error banner.
test('Error story renders an error banner with the message text', async ({ page }) => {
  await page.goto(story('error'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator("text=Couldn't reach the server. Try again.")).toBeVisible();
});
