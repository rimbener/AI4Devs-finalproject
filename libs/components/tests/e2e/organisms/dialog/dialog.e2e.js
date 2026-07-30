const { test, expect } = require('@playwright/test');

// Title 'Organisms/Dialog' → slug 'organisms-dialog'.
const story = (name) => `/?path=/story/organisms-dialog--${name}`;

test('Interactive story opens the dialog from the trigger', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator('text=Open dialog').first()).toBeVisible();
  await canvas.locator('text=Open dialog').first().click();

  await expect(canvas.locator('text=Delete this lesson?').first()).toBeVisible();
  await expect(canvas.locator('text=Delete lesson').first()).toBeVisible();
  await expect(canvas.locator('text=Keep it').first()).toBeVisible();
});
