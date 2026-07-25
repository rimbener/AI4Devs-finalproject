const { test, expect } = require('@playwright/test');

test('Card component renders', async ({ page }) => {
  await page.goto('/?path=/story/atoms-card--elevated');
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  const storyContainer = canvas
    .locator('div')
    .filter({ has: canvas.locator('text=Photosynthesis basics') })
    .first();
  await expect(storyContainer).toBeVisible();
});
