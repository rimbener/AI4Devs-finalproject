const { test, expect } = require('@playwright/test');

test('WithImage opens the lightbox and dismisses it from the close control', async ({ page }) => {
  await page.goto('/?path=/story/organisms-slideimage--with-image');

  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');
  await expect(canvas.getByLabel('View image fullscreen')).toBeVisible();

  await canvas.getByLabel('View image fullscreen').click();

  await expect(canvas.getByLabel('Close image')).toBeVisible();
  await canvas.getByLabel('Close image').click();

  await expect(canvas.getByLabel('Close image')).toHaveCount(0);
});
