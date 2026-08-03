const { test, expect } = require('@playwright/test');

// Story decorators share the URL mock; parallel stories could overwrite its active value.
test.describe.configure({ mode: 'serial' });

test('WithImage opens the lightbox and dismisses it from the close control', async ({ page }) => {
  await page.goto('/?path=/story/molecules-slideimage--with-image');

  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');
  await expect(canvas.getByLabel('View image fullscreen')).toBeVisible();

  await canvas.getByLabel('View image fullscreen').click();

  await expect(canvas.getByLabel('Close image')).toBeVisible();
  await canvas.getByLabel('Close image').click();

  await expect(canvas.getByLabel('Close image')).toHaveCount(0);
});

test('SplitImage opens the lightbox from the bounded pane', async ({ page }) => {
  await page.goto('/?path=/story/molecules-slideimage--split-image');

  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');
  await expect(canvas.getByLabel('View image fullscreen')).toBeVisible();
  await canvas.getByLabel('View image fullscreen').click();

  await expect(canvas.getByLabel('Close image')).toBeVisible();
});
