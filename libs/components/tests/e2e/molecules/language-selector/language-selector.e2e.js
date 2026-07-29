const { test, expect } = require('@playwright/test');

// Title 'Molecules/LanguageSelector' → slug 'molecules-languageselector'.
const story = (name) => `/?path=/story/molecules-languageselector--${name}`;

test('Interactive story lets the user switch languages on the web', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.locator('text=Português').click();
  await expect(canvas.locator('text=Português')).toBeVisible();
  await expect(canvas.getByText('check', { exact: true })).toBeVisible();
});
