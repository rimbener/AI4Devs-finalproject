const { test, expect } = require('@playwright/test');

// Title 'Organisms/CardListWithABMDialog' → slug 'organisms-cardlistwithabmdialog'.
const story = (name) => `/?path=/story/organisms-cardlistwithabmdialog--${name}`;

// @s17 — tapping the add button notifies the caller (onAddPress).
test('tapping the add button calls onAddPress', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator('text=Added 0 times')).toBeVisible();

  await canvas.locator('text=Add flashcard').click();
  await expect(canvas.locator('text=Added 1 times')).toBeVisible();

  await canvas.locator('text=Add flashcard').click();
  await expect(canvas.locator('text=Added 2 times')).toBeVisible();
});
