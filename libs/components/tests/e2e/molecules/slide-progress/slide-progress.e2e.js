const { test, expect } = require('@playwright/test');

test('Slide progress story page loads', async ({ page }) => {
  await page.goto('/?path=/story/molecules-slide-progress--default');

  const iframe = page.locator('iframe[title="storybook-preview-iframe"]');
  await expect(iframe).toBeVisible();

  expect(page.url()).toContain('molecules-slide-progress--default');
});
