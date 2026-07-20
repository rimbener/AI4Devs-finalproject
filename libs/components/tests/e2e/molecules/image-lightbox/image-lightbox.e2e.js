const { test, expect } = require('@playwright/test');

test('Open story displays the lightbox image and close control', async ({ page }) => {
  await page.goto('/?path=/story/molecules-imagelightbox--open');

  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');
  await expect(canvas.locator('img')).toBeVisible();
  await expect(canvas.getByLabel('Close image')).toBeVisible();
});

test('Hidden story does not display the lightbox image', async ({ page }) => {
  await page.goto('/?path=/story/molecules-imagelightbox--hidden');

  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');
  await expect(canvas.locator('img')).not.toBeVisible();
});
